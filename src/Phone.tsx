import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { invalidate, useThree } from '@react-three/fiber'
import { useStore } from './store'

const W = 7.06
const H = 14.66
const D = 0.78
const CORNER = 1.0
// Screen visible area (PlaneGeometry — correct UVs for textures)
const SCREEN_W = 6.3
const SCREEN_H = 13.5

// Build a rounded-rect path
function roundedPath(w: number, h: number, r: number, reverse = false) {
  const path = new THREE.Path()
  const x = -w / 2, y = -h / 2
  if (!reverse) {
    path.moveTo(x + r, y)
    path.lineTo(x + w - r, y)
    path.quadraticCurveTo(x + w, y, x + w, y + r)
    path.lineTo(x + w, y + h - r)
    path.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    path.lineTo(x + r, y + h)
    path.quadraticCurveTo(x, y + h, x, y + h - r)
    path.lineTo(x, y + r)
    path.quadraticCurveTo(x, y, x + r, y)
  } else {
    // Reversed winding (for holes)
    path.moveTo(x + r, y)
    path.quadraticCurveTo(x, y, x, y + r)
    path.lineTo(x, y + h - r)
    path.quadraticCurveTo(x, y + h, x + r, y + h)
    path.lineTo(x + w - r, y + h)
    path.quadraticCurveTo(x + w, y + h, x + w, y + h - r)
    path.lineTo(x + w, y + r)
    path.quadraticCurveTo(x + w, y, x + w - r, y)
    path.lineTo(x + r, y)
  }
  return path
}

/** R3F can reset `map` on reconciler passes; keep one THREE material and assign `map` imperatively. */
function PhoneScreenPlane({ screenshot }: { screenshot: string | null }) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x050505),
        toneMapped: false,
      }),
    [],
  )
  const gl = useThree((s) => s.gl)
  const setScreenLoadError = useStore((s) => s.setScreenLoadError)

  useEffect(() => {
    /* THREE.MeshBasicMaterial is mutated via .map / .color (not React state). */
    /* eslint-disable react-hooks/immutability */
    if (!screenshot) {
      mat.map?.dispose()
      mat.map = null
      mat.color.set(0x050505)
      mat.needsUpdate = true
      return
    }

    let cancelled = false
    queueMicrotask(() => setScreenLoadError(null))

    const loader = new THREE.TextureLoader()
    loader.load(
      screenshot,
      (tex) => {
        if (cancelled) {
          tex.dispose()
          return
        }
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy())
        tex.needsUpdate = true
        mat.map?.dispose()
        mat.map = tex
        mat.color.set(0xffffff)
        mat.needsUpdate = true
        if ('initTexture' in gl && typeof gl.initTexture === 'function') {
          gl.initTexture(tex)
        }
        invalidate()
        setScreenLoadError(null)
      },
      undefined,
      () => {
        if (cancelled) return
        mat.map?.dispose()
        mat.map = null
        mat.color.set(0x050505)
        mat.needsUpdate = true
        setScreenLoadError(
          'No se pudo mostrar la imagen en 3D. Prueba JPEG o PNG, o exporta la captura sin HEIC.',
        )
      },
    )

    return () => {
      cancelled = true
      mat.map?.dispose()
      mat.map = null
      mat.color.set(0x050505)
      mat.needsUpdate = true
    }
    /* eslint-enable react-hooks/immutability */
  }, [screenshot, gl, mat, setScreenLoadError])

  useEffect(
    () => () => {
      mat.map?.dispose()
      mat.dispose()
    },
    [mat],
  )

  return (
    <mesh position={[0, 0, D / 2 + 0.006]}>
      <planeGeometry args={[SCREEN_W, SCREEN_H]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

function DynamicIsland() {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    const pw = 1.85, ph = 0.55, pr = ph / 2
    s.moveTo(-pw / 2 + pr, -ph / 2)
    s.lineTo(pw / 2 - pr, -ph / 2)
    s.absarc(pw / 2 - pr, 0, pr, -Math.PI / 2, Math.PI / 2, false)
    s.lineTo(-pw / 2 + pr, ph / 2)
    s.absarc(-pw / 2 + pr, 0, pr, Math.PI / 2, -Math.PI / 2, false)
    return s
  }, [])

  return (
    <mesh position={[0, H / 2 - 1.0, D / 2 + 0.018]}>
      <shapeGeometry args={[shape, 32]} />
      <meshBasicMaterial color="#000" />
    </mesh>
  )
}

function CameraLens({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.55, 0.55, 0.16, 48]} />
        <meshPhysicalMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.4, 0.42, 0.04, 48]} />
        <meshPhysicalMaterial color="#050811" metalness={0.1} roughness={0} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 32]} />
        <meshBasicMaterial color="#000" />
      </mesh>
    </group>
  )
}

function CameraModule({ deviceColor }: { deviceColor: string }) {
  return (
    <group position={[-W / 2 + 1.85, H / 2 - 2.4, -D / 2 - 0.16]}>
      <RoundedBox args={[2.85, 2.85, 0.32]} radius={0.55} smoothness={6}>
        <meshPhysicalMaterial color={deviceColor} metalness={0.5} roughness={0.45} />
      </RoundedBox>
      <CameraLens position={[-0.75, 0.75, 0.18]} />
      <CameraLens position={[0.75, 0.75, 0.18]} />
      <CameraLens position={[-0.75, -0.75, 0.18]} />
      <mesh position={[0.75, -0.75, 0.18]}>
        <circleGeometry args={[0.22, 32]} />
        <meshBasicMaterial color="#c8a060" />
      </mesh>
    </group>
  )
}

export function Phone() {
  const { screenshot, deviceColor } = useStore()

  // Bezel: outer rounded shape with inner hole (screen cutout)
  // This sits IN FRONT of the screen plane and masks the corners
  const bezelGeom = useMemo(() => {
    const outer = new THREE.Shape()
    const ow = W - 0.12, oh = H - 0.12, or_ = CORNER - 0.05
    const ox = -ow / 2, oy = -oh / 2
    outer.moveTo(ox + or_, oy)
    outer.lineTo(ox + ow - or_, oy)
    outer.quadraticCurveTo(ox + ow, oy, ox + ow, oy + or_)
    outer.lineTo(ox + ow, oy + oh - or_)
    outer.quadraticCurveTo(ox + ow, oy + oh, ox + ow - or_, oy + oh)
    outer.lineTo(ox + or_, oy + oh)
    outer.quadraticCurveTo(ox, oy + oh, ox, oy + oh - or_)
    outer.lineTo(ox, oy + or_)
    outer.quadraticCurveTo(ox, oy, ox + or_, oy)
    // Hole = screen viewport (reversed winding)
    const hole = roundedPath(SCREEN_W, SCREEN_H, 0.35, true)
    outer.holes.push(hole)
    return new THREE.ShapeGeometry(outer, 48)
  }, [])

  return (
    <group>
      <RoundedBox
        args={[W, H, D]}
        radius={CORNER}
        smoothness={8}
        bevelSegments={4}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={deviceColor}
          metalness={0.4}
          roughness={0.55}
          clearcoat={0.2}
          clearcoatRoughness={0.4}
        />
      </RoundedBox>

      <PhoneScreenPlane screenshot={screenshot} />

      {/* Bezel ring with hole — sits in front, masks screen corners + provides border */}
      <mesh position={[0, 0, D / 2 + 0.010]} geometry={bezelGeom}>
        <meshBasicMaterial color="#000" side={THREE.DoubleSide} />
      </mesh>

      <DynamicIsland />
      <CameraModule deviceColor={deviceColor} />

      {/* Action button */}
      <mesh position={[-W / 2 - 0.025, H / 2 - 2.3, 0]}>
        <boxGeometry args={[0.08, 0.6, D * 0.5]} />
        <meshPhysicalMaterial color={deviceColor} metalness={0.85} roughness={0.35} />
      </mesh>
      {/* Volume up */}
      <mesh position={[-W / 2 - 0.025, H / 2 - 3.5, 0]}>
        <boxGeometry args={[0.08, 1.0, D * 0.5]} />
        <meshPhysicalMaterial color={deviceColor} metalness={0.85} roughness={0.35} />
      </mesh>
      {/* Volume down */}
      <mesh position={[-W / 2 - 0.025, H / 2 - 4.8, 0]}>
        <boxGeometry args={[0.08, 1.0, D * 0.5]} />
        <meshPhysicalMaterial color={deviceColor} metalness={0.85} roughness={0.35} />
      </mesh>
      {/* Power */}
      <mesh position={[W / 2 + 0.025, H / 2 - 3.5, 0]}>
        <boxGeometry args={[0.08, 1.6, D * 0.5]} />
        <meshPhysicalMaterial color={deviceColor} metalness={0.85} roughness={0.35} />
      </mesh>
    </group>
  )
}
