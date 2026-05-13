import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from './store'
import { ScreenshotPlane } from './ScreenshotPlane'

const MODEL_URL = '/models/macbook/macbook.glb'

/** MR material name in the GLB (Substance export). */
const BODY_MAT = 'ASSET_MAT_MR'

/** Same target height as `PhoneFromGltf` so Mac fills the frame like the iPhone GLB. */
const TARGET_H = 14.66

type LidScreenLayout = {
  cx: number
  cy: number
  cz: number
  w: number
  h: number
}

function findMainMesh(root: THREE.Object3D): THREE.Mesh | null {
  let found: THREE.Mesh | null = null
  root.traverse((obj) => {
    if (found) return
    const m = obj as THREE.Mesh
    if (m.isMesh) found = m
  })
  return found
}

/**
 * World-space height of the mesh (local bbox × world scale), before `wrapper` scale.
 * Avoids using world-axis AABB height, which can blow up when ancestors rotate the model.
 */
function meshWorldHeightBeforeWrapperScale(mesh: THREE.Mesh): number {
  mesh.updateMatrixWorld(true)
  const g = mesh.geometry
  g.computeBoundingBox()
  const b = g.boundingBox
  if (!b) return 0
  const localH = b.max.y - b.min.y
  const ws = new THREE.Vector3()
  mesh.getWorldScale(ws)
  return localH * Math.abs(ws.y)
}

/** Lid glass in mesh-local space: upper half + normals toward +Z (plane XY). */
function computeLidScreenLayout(mesh: THREE.Mesh): LidScreenLayout | null {
  const geom = mesh.geometry
  const pos = geom.getAttribute('position')
  const nor = geom.getAttribute('normal')
  if (!pos || !nor) return null
  geom.computeBoundingBox()
  const box = geom.boundingBox
  if (!box) return null

  const ycut = box.min.y + (box.max.y - box.min.y) * 0.48
  let minx = Infinity,
    miny = Infinity,
    minz = Infinity,
    maxx = -Infinity,
    maxy = -Infinity,
    maxz = -Infinity
  let cnt = 0
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i)
    const nz = nor.getZ(i)
    if (y < ycut || nz < 0.72) continue
    minx = Math.min(minx, x)
    maxx = Math.max(maxx, x)
    miny = Math.min(miny, y)
    maxy = Math.max(maxy, y)
    minz = Math.min(minz, z)
    maxz = Math.max(maxz, z)
    cnt++
  }
  if (cnt < 100) return null
  return {
    cx: (minx + maxx) / 2,
    cy: (miny + maxy) / 2,
    cz: (minz + maxz) / 2,
    w: maxx - minx,
    h: maxy - miny,
  }
}

const _c = new THREE.Vector3()
const _qWrap = new THREE.Quaternion()
const _qMesh = new THREE.Quaternion()

export function MacBookFromGltf() {
  const { screenshot, deviceColor } = useStore()
  const { scene } = useGLTF(MODEL_URL)
  const wrapperRef = useRef<THREE.Group>(null)
  const screenOverlayRef = useRef<THREE.Group>(null)
  const [screenSpec, setScreenSpec] = useState<{ w: number; h: number; r: number } | null>(null)

  const root = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m: THREE.Material) => m.clone())
      } else if (mesh.material) {
        mesh.material = (mesh.material as THREE.Material).clone()
      }
    })
    return clone
  }, [scene])

  const layout = useMemo(() => {
    const m = findMainMesh(root)
    return m ? computeLidScreenLayout(m) : null
  }, [root])

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    root.position.set(0, 0, 0)
    wrapper.scale.set(1, 1, 1)
    wrapper.position.set(0, 0, 0)
    root.updateMatrixWorld(true)

    const mesh = findMainMesh(root)
    let h = mesh ? meshWorldHeightBeforeWrapperScale(mesh) : 0
    if (h < 0.001) {
      const box = new THREE.Box3().setFromObject(root)
      h = box.max.y - box.min.y
    }
    if (h < 0.001) return

    /** Ignore pathological AABB / matrix glitches that would make `s` microscopic and blow up screen plane size. */
    h = THREE.MathUtils.clamp(h, 0.06, 4)
    const s = THREE.MathUtils.clamp(TARGET_H / h, 2, 220)
    wrapper.scale.setScalar(s)
    root.updateMatrixWorld(true)

    const box2 = new THREE.Box3().setFromObject(root)
    const centerWorld = box2.getCenter(new THREE.Vector3())
    wrapper.updateMatrixWorld(true)
    wrapper.worldToLocal(centerWorld)
    root.position.set(-centerWorld.x, -centerWorld.y, -centerWorld.z)
  }, [root])

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    const overlay = screenOverlayRef.current
    if (!wrapper || !layout || !overlay) {
      setScreenSpec(null)
      return
    }

    const mesh = findMainMesh(root)
    if (!mesh) {
      setScreenSpec(null)
      return
    }

    mesh.updateMatrixWorld(true)
    wrapper.updateMatrixWorld(true)

    _c.set(layout.cx, layout.cy, layout.cz + 0.18)
    mesh.localToWorld(_c)
    wrapper.worldToLocal(_c)
    overlay.position.copy(_c)

    wrapper.getWorldQuaternion(_qWrap)
    mesh.getWorldQuaternion(_qMesh)
    overlay.quaternion.copy(_qWrap.clone().invert().multiply(_qMesh))

    /** Plane size in wrapper-local scene units: same scale as laptop (`TARGET_H` = full body height). */
    mesh.geometry.computeBoundingBox()
    const bb = mesh.geometry.boundingBox
    const fullH = bb ? Math.max(bb.max.y - bb.min.y, 1e-4) : 1
    const sw = THREE.MathUtils.clamp(TARGET_H * (layout.w / fullH) * 0.98, 5, 42)
    const sh = THREE.MathUtils.clamp(TARGET_H * (layout.h / fullH) * 0.98, 3, 28)
    const r = Math.min(0.14 * Math.min(sw, sh), 0.24 * Math.min(sw, sh))

    setScreenSpec({ w: sw, h: sh, r })
  }, [root, layout])

  useEffect(() => {
    const c = new THREE.Color(deviceColor)
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat?.name === BODY_MAT) {
        mat.color.copy(c)
      }
    })
  }, [root, deviceColor])

  return (
    <group position={[0, -1.05, 0]} rotation={[0, -0.22, 0]}>
      <group ref={wrapperRef}>
        <primitive object={root} />
        {layout ? (
          <group ref={screenOverlayRef} raycast={() => undefined}>
            {screenSpec ? (
              <ScreenshotPlane
                screenshot={screenshot}
                screenW={screenSpec.w}
                screenH={screenSpec.h}
                openingCornerR={screenSpec.r}
                z={0}
                flipTexture180
              />
            ) : null}
          </group>
        ) : null}
      </group>
    </group>
  )
}

useGLTF.preload(MODEL_URL)
