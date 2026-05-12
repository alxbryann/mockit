import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'
import { MacBook } from './MacBook'
import { PhoneFromGltf } from './PhoneFromGltf'
import { PhoneProcedural } from './PhoneProcedural'
import { useStore } from './store'
import { captureSceneToPngDataUrl } from './highResCapture'
import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { MOUSE, TOUCH } from 'three'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

/** Pixels → radians; tuned to feel close to direct manipulation */
const DEVICE_DRAG_SENS = 0.007
/** Same convention as drei `OrbitControls` `autoRotateSpeed` — rad applied per `controls.update()` at ~60fps */
const DEVICE_AUTO_ROTATE_SPEED = 1.2

/** Orbit dolly limits — keep in sync with `<OrbitControls minDistance/maxDistance />`. */
export const ORBIT_MIN_DISTANCE = 18
export const ORBIT_MAX_DISTANCE = 50

/**
 * Zoom en la UI = (esta distancia ÷ distancia de órbita)× — ~2× al máximo acercamiento, ~0.7× al alejar.
 */
export const ORBIT_ZOOM_REF_DISTANCE = ORBIT_MIN_DISTANCE * 2

/**
 * Clic izquierdo: no hace nada en OrbitControls (`-1`), para poder girar el dispositivo en todo el lienzo.
 * Clic derecho: órbita de la cámara.
 */
const MOUSE_DEVICE_VIEW_MODE = {
  LEFT: -1,
  MIDDLE: MOUSE.DOLLY,
  RIGHT: MOUSE.ROTATE,
} as { LEFT: number; MIDDLE: MOUSE; RIGHT: MOUSE }

/**
 * Un dedo con enablePan=false no entra en modo cámara; el arrastre lo manejan el pick del dispositivo o el fondo.
 */
const TOUCH_DEVICE_VIEW_MODE = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_PAN } as const

function DeviceScene({
  children,
  orbitControlsRef,
}: {
  children: React.ReactNode
  orbitControlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  const gl = useThree((s) => s.gl)
  const cameraPanFree = useStore((s) => s.cameraPanFree)
  const deviceRotation = useStore((s) => s.deviceRotation)
  const setDeviceRotation = useStore((s) => s.setDeviceRotation)
  const autoRotate = useStore((s) => s.autoRotate)

  const dragActiveRef = useRef(false)
  const lastRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragActiveRef.current) return
      const dx = e.clientX - lastRef.current.x
      const dy = e.clientY - lastRef.current.y
      lastRef.current = { x: e.clientX, y: e.clientY }
      const [rx, ry, rz] = useStore.getState().deviceRotation
      if (e.shiftKey) {
        setDeviceRotation([rx, ry, rz - dx * DEVICE_DRAG_SENS])
      } else {
        setDeviceRotation([rx + dy * DEVICE_DRAG_SENS, ry + dx * DEVICE_DRAG_SENS, rz])
      }
    }
    function endDrag(e: PointerEvent) {
      if (!dragActiveRef.current) return
      dragActiveRef.current = false
      try {
        gl.domElement.releasePointerCapture(e.pointerId)
      } catch {
        /* releasePointerCapture throws if capture was already released */
      }
      const ctl = orbitControlsRef.current
      if (ctl) ctl.enabled = true
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [gl.domElement, orbitControlsRef, setDeviceRotation])

  /** Igual que OrbitControls: `2π/3600 * speed` por update (~1 frame). */
  useFrame(() => {
    if (!autoRotate || cameraPanFree || dragActiveRef.current) return
    const step = ((2 * Math.PI) / 3600) * DEVICE_AUTO_ROTATE_SPEED
    const [rx, ry, rz] = useStore.getState().deviceRotation
    useStore.getState().setDeviceRotation([rx, ry + step, rz])
  })

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    if (cameraPanFree || e.button !== 0) return
    e.stopPropagation()
    dragActiveRef.current = true
    lastRef.current = { x: e.clientX, y: e.clientY }
    const ctl = orbitControlsRef.current
    if (ctl) ctl.enabled = false
    try {
      gl.domElement.setPointerCapture(e.pointerId)
    } catch {
      /* setPointerCapture can fail for invalid ids */
    }
  }

  return (
    <>
      {!cameraPanFree ? (
        <mesh position={[0, 0, -56]} onPointerDown={onPointerDown}>
          <planeGeometry args={[480, 480]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : null}
      <group rotation={deviceRotation} onPointerDown={onPointerDown}>
        {children}
      </group>
    </>
  )
}

const rollQuat = new THREE.Quaternion()
const rollAxis = new THREE.Vector3(0, 0, -1)

/** Pan con clic izquierdo; en modo normal el izquierdo es órbita. */
const MOUSE_PAN_MODE = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE } as const
const TOUCH_PAN_MODE = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_PAN } as const

function OrbitWithRoll({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const cameraRoll = useStore((s) => s.cameraRoll)
  const cameraPanFree = useStore((s) => s.cameraPanFree)
  const lastOrbitDistRef = useRef<number | null>(null)

  const mouseButtons = useMemo(
    () => (cameraPanFree ? MOUSE_PAN_MODE : MOUSE_DEVICE_VIEW_MODE),
    [cameraPanFree],
  )
  const touches = useMemo(
    () => (cameraPanFree ? TOUCH_PAN_MODE : TOUCH_DEVICE_VIEW_MODE),
    [cameraPanFree],
  )

  useLayoutEffect(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    if (cameraPanFree) canvas.style.cursor = 'grab'
    else canvas.style.cursor = ''
    return () => {
      canvas.style.cursor = ''
    }
  }, [cameraPanFree])

  useEffect(() => {
    if (!cameraPanFree) return
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const onDown = () => {
      canvas.style.cursor = 'grabbing'
    }
    const onUp = () => {
      canvas.style.cursor = 'grab'
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
  }, [cameraPanFree])

  useFrame(() => {
    const ctl = controlsRef.current
    if (ctl) {
      const d = ctl.getDistance()
      const stepped = Math.round(d * 10) / 10
      if (lastOrbitDistRef.current !== stepped) {
        lastOrbitDistRef.current = stepped
        useStore.getState().setOrbitDistance(stepped)
      }
    }
    if (!ctl || cameraRoll === 0) return
    const cam = ctl.object as THREE.PerspectiveCamera
    rollQuat.setFromAxisAngle(rollAxis, cameraRoll)
    cam.quaternion.multiply(rollQuat)
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={cameraPanFree}
      screenSpacePanning={cameraPanFree}
      enableRotate={!cameraPanFree}
      mouseButtons={mouseButtons}
      touches={touches}
      autoRotate={false}
      minDistance={ORBIT_MIN_DISTANCE}
      maxDistance={ORBIT_MAX_DISTANCE}
    />
  )
}

function SceneBackgroundSync() {
  const bgColor = useStore((s) => s.bgColor)
  return <color attach="background" args={[bgColor]} />
}

function SceneCaptureRegistration() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const setCaptureSceneAtSize = useStore((s) => s.setCaptureSceneAtSize)

  useEffect(() => {
    const impl = (width: number, height: number, opts?: { transparent?: boolean }) =>
      captureSceneToPngDataUrl(gl, scene, camera as THREE.PerspectiveCamera, width, height, opts)
    setCaptureSceneAtSize(impl)
    // Expose raw Three.js context for headless zoom control in renderApi
    ;(window as any).__mockitCtx = { gl, scene, camera }
    return () => {
      setCaptureSceneAtSize(null)
      ;(window as any).__mockitCtx = null
    }
  }, [gl, scene, camera, setCaptureSceneAtSize])
  return null
}

/** Evita que el plano de sombra reciba raycasts y bloquee el arrastre del fondo. */
function SceneContactShadows({ deviceKind }: { deviceKind: 'phone' | 'mac' }) {
  const groupRef = useRef<THREE.Group>(null)
  useLayoutEffect(() => {
    const g = groupRef.current
    if (!g) return
    g.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        ;(o as THREE.Mesh).raycast = () => {}
      }
    })
  }, [deviceKind])
  return (
    <ContactShadows
      ref={groupRef}
      position={[0, -9, 0]}
      opacity={0.55}
      scale={deviceKind === 'mac' ? 34 : 22}
      blur={2.8}
      far={12}
    />
  )
}

function SceneWorld() {
  const deviceKind = useStore((s) => s.deviceKind)
  const orbitControlsRef = useRef<OrbitControlsImpl>(null)

  return (
    <>
      <SceneBackgroundSync />
      <SceneCaptureRegistration />
      <ambientLight intensity={0.2} />
      <hemisphereLight args={['#f2f4ff', '#1a1c22', 0.35]} position={[0, 1, 0]} />
      <directionalLight
        position={[9, 11, 7]}
        intensity={1.05}
        castShadow
        color="#fffaf4"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={40}
        shadow-camera-near={4}
        shadow-bias={-0.00015}
      />
      <directionalLight position={[-11, 2, -4]} intensity={0.38} color="#c8d8ff" />
      <directionalLight position={[2, -4, -14]} intensity={0.42} color="#ffffff" />
      <pointLight position={[0, 7, 6]} intensity={0.22} color="#fff5eb" />

      <DeviceScene orbitControlsRef={orbitControlsRef}>
        {deviceKind === 'phone' ? (
            <Suspense fallback={<PhoneProcedural />}>
              <PhoneFromGltf />
            </Suspense>
          ) : <MacBook />}
      </DeviceScene>

      <SceneContactShadows deviceKind={deviceKind} />
      <Environment preset="studio" environmentIntensity={0.74} />
      <OrbitWithRoll controlsRef={orbitControlsRef} />
    </>
  )
}

export const Scene = forwardRef<HTMLCanvasElement>(function Scene(_props, ref) {
  const bgColor = useStore((s) => s.bgColor)

  return (
    <Canvas
      ref={ref}
      shadows
      camera={{ position: [0, 0, 28], fov: 28 }}
      gl={{ preserveDrawingBuffer: true, antialias: true, toneMappingExposure: 0.94 }}
      style={{ background: bgColor, width: '100%', height: '100%' }}
    >
      <SceneWorld />
    </Canvas>
  )
})
