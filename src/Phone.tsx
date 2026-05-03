import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { invalidate, useThree } from '@react-three/fiber'
import { useStore } from './store'
import {
  frameColorSaturation,
  frameMaterialLuminance,
  getDeviceFrameSurfaceMaps,
} from './deviceFrameTextures'

type FramePhysicalProps = {
  color: string
  metalness: number
  roughness: number
  roughnessMap: THREE.Texture
  normalMap: THREE.Texture
  normalScale: THREE.Vector2
  anisotropy: number
  anisotropyRotation: number
  clearcoat: number
  clearcoatRoughness: number
  envMapIntensity: number
}

function useFramePhysicalMaterial(deviceColor: string): FramePhysicalProps {
  const normalDark = useMemo(() => new THREE.Vector2(0.48, 0.48), [])
  /** Micro‑relieve visible en aluminio cepillado (el valor bajo anterior dejaba el marco “plástico”). */
  const normalBrushed = useMemo(() => new THREE.Vector2(0.4, 0.4), [])

  return useMemo(() => {
    const lum = frameMaterialLuminance(deviceColor)
    const sat = frameColorSaturation(deviceColor)
    const isDark = lum < 0.3
    const maps = getDeviceFrameSurfaceMaps(isDark ? 'titanium' : 'aluminum')

    // Anisotropy off: with ExtrudeGeometry/RoundedBox, missing/degenerate tangents + anisotropic
    // clearcoat BRDF can produce solid black vertical bands on some GPUs (driver/shader edge cases).
    if (isDark) {
      return {
        color: deviceColor,
        metalness: 0.94,
        roughness: 0.5,
        roughnessMap: maps.roughnessMap,
        normalMap: maps.normalMap,
        normalScale: normalDark,
        anisotropy: 0,
        anisotropyRotation: 0,
        clearcoat: 0.05,
        clearcoatRoughness: 0.85,
        envMapIntensity: 1.25,
      }
    }

    // Natural / plateado / colores: marco de aluminio anodizado (no pintura dieléctrica).
    const starlightLike = lum > 0.58 && sat < 0.12
    const metalness = starlightLike ? 0.93 : 0.89
    const roughness = Math.min(0.52, starlightLike ? 0.38 : 0.44 + (1 - lum) * 0.05)
    const envMapIntensity = starlightLike ? 1.52 : 1.24

    return {
      color: deviceColor,
      metalness,
      roughness,
      roughnessMap: maps.roughnessMap,
      normalMap: maps.normalMap,
      normalScale: normalBrushed,
      anisotropy: 0,
      anisotropyRotation: 0,
      clearcoat: 0.055,
      clearcoatRoughness: 0.72,
      envMapIntensity,
    }
  }, [deviceColor, normalDark, normalBrushed])
}

const W = 7.06
const H = 14.66
const D = 0.78
const CORNER = 1.0
// Screen visible area (texture plane matches bezel hole rounding)
const SCREEN_W = 6.3
const SCREEN_H = 13.5
/** Inner opening of the bezel mask — must match `PhoneScreenPlane` rounding. */
const SCREEN_OPENING_CORNER_R = 0.35
/** Inset of the lit screen mesh vs opening (per side); keeps pixels off the black ring. */
const SCREEN_PLANE_INSET = 0.08

/** Front cap of RoundedBox (ExtrudeGeometry + bevel) sits near z = D/2; keep layers separated or depth buffer flickers (checkerboard). */
const BODY_FRONT_Z = D / 2
/** Rounded platform top sits slightly below the texture; bezel stays in front. */
const SCREEN_Z = BODY_FRONT_Z + 0.024
const SCREEN_PLATFORM_DEPTH = 0.07
const SCREEN_PLATFORM_CENTER_Z = SCREEN_Z - 0.01 - SCREEN_PLATFORM_DEPTH / 2
const BEZEL_Z = BODY_FRONT_Z + 0.03

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape()
  const x = -w / 2,
    y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

/**
 * `ShapeGeometry` in three@0.184 sets `uv` to raw vertex (x,y) — not [0,1]. Without this,
 * textures only sample a ~1×1 patch at the center (clamp) and look like a tiny thumbnail.
 */
function applyBoundingBoxUVs(geom: THREE.BufferGeometry, width: number, height: number) {
  const pos = geom.getAttribute('position')
  const uv = geom.getAttribute('uv')
  if (!pos || !uv) return
  const pa = pos.array as Float32Array
  const uva = uv.array as Float32Array
  const hw = width / 2
  const hh = height / 2
  for (let i = 0; i < pa.length; i += 3) {
    const vx = pa[i]
    const vy = pa[i + 1]
    const j = (i / 3) * 2
    uva[j] = (vx + hw) / width
    uva[j + 1] = (vy + hh) / height
  }
  uv.needsUpdate = true
}

function roundedHolePath(w: number, h: number, r: number): THREE.Path {
  const path = new THREE.Path()
  const x = -w / 2,
    y = -h / 2
  path.moveTo(x + r, y)
  path.quadraticCurveTo(x, y, x, y + r)
  path.lineTo(x, y + h - r)
  path.quadraticCurveTo(x, y + h, x + r, y + h)
  path.lineTo(x + w - r, y + h)
  path.quadraticCurveTo(x + w, y + h, x + w, y + h - r)
  path.lineTo(x + w, y + r)
  path.quadraticCurveTo(x + w, y, x + w - r, y)
  path.lineTo(x + r, y)
  return path
}

/** R3F can reset `map` on reconciler passes; keep one THREE material and assign `map` imperatively. */
function PhoneScreenPlane({ screenshot }: { screenshot: string | null }) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x050505),
        toneMapped: false,
        depthWrite: true,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
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
        tex.wrapS = THREE.ClampToEdgeWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        tex.minFilter = THREE.LinearMipmapLinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.generateMipmaps = true
        tex.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
        tex.needsUpdate = true
        mat.map?.dispose()
        mat.map = tex
        mat.color.set(0xffffff)
        mat.needsUpdate = true
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

  const pw = SCREEN_W - SCREEN_PLANE_INSET * 2
  const ph = SCREEN_H - SCREEN_PLANE_INSET * 2
  const cornerR = Math.max(
    0.06,
    SCREEN_OPENING_CORNER_R - SCREEN_PLANE_INSET,
  )

  const screenGeom = useMemo(() => {
    const shape = roundedRectShape(pw, ph, cornerR)
    const g = new THREE.ShapeGeometry(shape, 64)
    applyBoundingBoxUVs(g, pw, ph)
    return g
  }, [pw, ph, cornerR])

  useEffect(
    () => () => {
      screenGeom.dispose()
    },
    [screenGeom],
  )

  return (
    <mesh position={[0, 0, SCREEN_Z]} geometry={screenGeom}>
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

/** Rounded “glass” slab under the screenshot so corners read as physical display stack, not a square bitmap on flat metal. */
function ScreenPlatform() {
  const radius = 0.42
  return (
    <RoundedBox
      args={[SCREEN_W - 0.02, SCREEN_H - 0.02, SCREEN_PLATFORM_DEPTH]}
      radius={radius}
      smoothness={5}
      position={[0, 0, SCREEN_PLATFORM_CENTER_Z]}
    >
      <meshPhysicalMaterial
        color="#050608"
        metalness={0.12}
        roughness={0.35}
        clearcoat={0.65}
        clearcoatRoughness={0.22}
        envMapIntensity={0.95}
      />
    </RoundedBox>
  )
}

/**
 * Camera lens — points outward from the back of the phone (-Z world direction).
 * The lens group itself isn't rotated; each cylinder is rotated [PI/2, 0, 0]
 * so its axis aligns with world +Z. "Outside" of the lens is at more negative z.
 */
function CameraLens({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Outer black housing (the well that holds the lens) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.22, 64]} />
        <meshPhysicalMaterial
          color="#0a0b0e"
          metalness={0.78}
          roughness={0.45}
          clearcoat={0.4}
          clearcoatRoughness={0.35}
          envMapIntensity={1.1}
        />
      </mesh>
      {/* Brushed metallic rim around the lens opening */}
      <mesh position={[0, 0, -0.115]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.50, 0.50, 0.025, 64]} />
        <meshPhysicalMaterial
          color="#8a8d92"
          metalness={0.96}
          roughness={0.22}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Lens glass — single opaque glossy disc (looks like sealed lens optics) */}
      <mesh position={[0, 0, -0.131]}>
        <circleGeometry args={[0.44, 64]} />
        <meshPhysicalMaterial
          color="#03050c"
          metalness={0.62}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.03}
          envMapIntensity={1.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Subtle inner pupil dot for depth */}
      <mesh position={[0, 0, -0.132]}>
        <circleGeometry args={[0.085, 32]} />
        <meshBasicMaterial color="#000" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function CameraModule({
  frameMat,
  deviceColor,
}: {
  frameMat: FramePhysicalProps
  deviceColor: string
}) {
  return (
    <group position={[-W / 2 + 1.85, H / 2 - 2.4, -D / 2]}>
      {/* Plateau in device color (Pro look) — glassy back-glass material */}
      <RoundedBox
        args={[2.85, 2.85, 0.32]}
        radius={0.55}
        smoothness={6}
        position={[0, 0, -0.16]}
        castShadow
      >
        <meshPhysicalMaterial
          color={deviceColor}
          metalness={0.18}
          roughness={0.5}
          clearcoat={0.55}
          clearcoatRoughness={0.3}
          envMapIntensity={1.1}
        />
      </RoundedBox>
      {/* Metal rim around plateau (between plateau and back of phone) */}
      <RoundedBox
        args={[2.9, 2.9, 0.05]}
        radius={0.56}
        smoothness={6}
        position={[0, 0, -0.025]}
      >
        <meshPhysicalMaterial
          {...frameMat}
          roughness={frameMat.roughness * 0.85}
          clearcoat={frameMat.clearcoat * 1.2}
        />
      </RoundedBox>

      {/* Three lenses sticking out the back (-Z) */}
      <CameraLens position={[-0.75, 0.75, -0.34]} />
      <CameraLens position={[0.75, 0.75, -0.34]} />
      <CameraLens position={[-0.75, -0.75, -0.34]} />

      {/* Flash (LED) */}
      <group position={[0.75, -0.85, -0.32]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.06, 32]} />
          <meshPhysicalMaterial color="#1b1c1f" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, -0.035]}>
          <circleGeometry args={[0.13, 32]} />
          <meshPhysicalMaterial
            color="#fff5e0"
            emissive="#fff0d8"
            emissiveIntensity={0.08}
            metalness={0.2}
            roughness={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* LiDAR sensor (smaller, dark) */}
      <group position={[0.18, -0.85, -0.32]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.05, 32]} />
          <meshPhysicalMaterial color="#16171a" metalness={0.4} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0, -0.03]}>
          <circleGeometry args={[0.11, 32]} />
          <meshPhysicalMaterial
            color="#0a0a0c"
            metalness={0.3}
            roughness={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  )
}

function BackPanel({ deviceColor }: { deviceColor: string }) {
  const shape = useMemo(
    () => roundedRectShape(W - 0.04, H - 0.04, CORNER - 0.02),
    [],
  )
  return (
    <mesh position={[0, 0, -D / 2 - 0.008]} rotation={[0, Math.PI, 0]}>
      <shapeGeometry args={[shape, 64]} />
      <meshPhysicalMaterial
        color={deviceColor}
        metalness={0.18}
        roughness={0.5}
        clearcoat={0.55}
        clearcoatRoughness={0.3}
        envMapIntensity={1.1}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  )
}

/** Pastillas del lateral: cápsula (semiesferas en Y); escala X horneada en la geometría para normales correctas. */
function SideButton({
  frameMat,
  side,
  y,
  length,
  variant,
}: {
  frameMat: FramePhysicalProps
  side: 'left' | 'right'
  y: number
  length: number
  variant: 'compact' | 'long'
}) {
  const depthZ = D * 0.56
  const thickX = variant === 'compact' ? 0.07 : 0.076
  // Radio de los tapones: limitado por el grosor en Z y por dejar un tramo cilíndrico mínimo (extremos bien redondos).
  const capR = Math.min(depthZ * 0.5 - 0.006, (length - 0.03) / 2)
  const cylLen = Math.max(0.03, length - 2 * capR)
  const scaleX = thickX / (2 * capR)

  const geometry = useMemo(() => {
    const g = new THREE.CapsuleGeometry(capR, cylLen, 10, 24)
    g.scale(scaleX, 1, 1)
    g.computeVertexNormals()
    return g
  }, [capR, cylLen, scaleX])

  useEffect(
    () => () => {
      geometry.dispose()
    },
    [geometry],
  )

  // Alinear la cara exterior del botón con la cara del RoundedBox (x = ±W/2 en la zona plana).
  // Antes: -W/2 - inset - thickX/2 colgaba todo el volumen fuera → doble bloque / costura lateral.
  const x = side === 'left' ? -W / 2 + thickX / 2 : W / 2 - thickX / 2

  return (
    <mesh position={[x, y, 0]} geometry={geometry} castShadow>
      <meshPhysicalMaterial
        {...frameMat}
        roughness={Math.min(0.92, frameMat.roughness * 1.08)}
        clearcoat={frameMat.clearcoat * 0.65}
        clearcoatRoughness={Math.min(0.95, frameMat.clearcoatRoughness * 1.15)}
        envMapIntensity={frameMat.envMapIntensity * 0.92}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </mesh>
  )
}

function BottomDetails() {
  // USB-C cutout — pill shape
  const usbcShape = useMemo(() => {
    const s = new THREE.Shape()
    const w = 0.85,
      h = 0.32,
      r = h / 2
    s.moveTo(-w / 2 + r, -h / 2)
    s.lineTo(w / 2 - r, -h / 2)
    s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false)
    s.lineTo(-w / 2 + r, h / 2)
    s.absarc(-w / 2 + r, 0, r, Math.PI / 2, -Math.PI / 2, false)
    return s
  }, [])

  const yBottom = -H / 2 - 0.0015
  const speakerOffsets = useMemo(() => [0, 1, 2, 3, 4, 5].map((i) => 1.2 + i * 0.16), [])

  const portMat = (
    <meshPhysicalMaterial
      color="#040406"
      metalness={0.2}
      roughness={0.6}
      clearcoat={0.4}
      clearcoatRoughness={0.4}
      side={THREE.DoubleSide}
    />
  )

  return (
    <group>
      {/* USB-C centered */}
      <mesh position={[0, yBottom, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[usbcShape, 32]} />
        {portMat}
      </mesh>
      {/* Inner USB-C connector hint */}
      <mesh position={[0, yBottom - 0.0005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.62, 0.13]} />
        <meshBasicMaterial color="#16181c" side={THREE.DoubleSide} />
      </mesh>

      {/* Speaker grille right (along X, at z=0 — flush with body) */}
      {speakerOffsets.map((x) => (
        <mesh key={`r-${x}`} position={[x, yBottom, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.045, 24]} />
          <meshBasicMaterial color="#000" side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Speaker grille left (mirrored) */}
      {speakerOffsets.map((x) => (
        <mesh key={`l-${x}`} position={[-x, yBottom, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.045, 24]} />
          <meshBasicMaterial color="#000" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

export function Phone() {
  const { screenshot, deviceColor } = useStore()
  const frameMat = useFramePhysicalMaterial(deviceColor)

  // Bezel: outer rounded shape with inner hole (screen cutout)
  // This sits IN FRONT of the screen plane and masks the corners
  const bezelGeom = useMemo(() => {
    const outer = roundedRectShape(W - 0.12, H - 0.12, CORNER - 0.05)
    const hole = roundedHolePath(SCREEN_W, SCREEN_H, SCREEN_OPENING_CORNER_R)
    outer.holes.push(hole)
    return new THREE.ShapeGeometry(outer, 48)
  }, [])

  return (
    <group>
      {/* Metal frame body */}
      <RoundedBox
        args={[W, H, D]}
        radius={CORNER}
        smoothness={8}
        bevelSegments={4}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial {...frameMat} />
      </RoundedBox>

      {/* Back panel — matte glass in device color */}
      <BackPanel deviceColor={deviceColor} />

      {/* Rounded display stack under the texture (screenshots already include status bar / island). */}
      <ScreenPlatform />

      {/* Screen image (just above body front, behind bezel) */}
      <PhoneScreenPlane screenshot={screenshot} />

      {/* Bezel ring with hole — matte black so it doesn't mirror the screen */}
      <mesh position={[0, 0, BEZEL_Z]} geometry={bezelGeom}>
        <meshBasicMaterial color="#000" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <CameraModule frameMat={frameMat} deviceColor={deviceColor} />

      {/* Lateral izquierdo: acción (pastilla corta, no “botón redondo” diminuto) + volumen ± */}
      <SideButton
        frameMat={frameMat}
        side="left"
        variant="long"
        y={H / 2 - 2.02}
        length={0.62}
      />
      <SideButton
        frameMat={frameMat}
        side="left"
        variant="long"
        y={H / 2 - 3.38}
        length={1.05}
      />
      <SideButton
        frameMat={frameMat}
        side="left"
        variant="long"
        y={H / 2 - 4.69}
        length={1.05}
      />
      {/* Power — misma cápsula, más larga */}
      <SideButton
        frameMat={frameMat}
        side="right"
        variant="long"
        y={H / 2 - 3.45}
        length={1.55}
      />

      <BottomDetails />
    </group>
  )
}
