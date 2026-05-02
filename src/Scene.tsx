import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Phone } from './Phone'
import { useStore } from './store'
import { forwardRef } from 'react'

export const Scene = forwardRef<HTMLCanvasElement>(function Scene(_props, ref) {
  const { bgColor, autoRotate } = useStore()

  return (
    <Canvas
      ref={ref}
      shadows
      camera={{ position: [0, 0, 28], fov: 28 }}
      gl={{ preserveDrawingBuffer: true, antialias: true, toneMappingExposure: 0.85 }}
      style={{ background: bgColor, width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 6]} intensity={0.7} castShadow />
      <directionalLight position={[-6, -3, -4]} intensity={0.25} color="#aabbff" />
      <pointLight position={[0, 8, 5]} intensity={0.3} />

      <Phone />

      <ContactShadows
        position={[0, -9, 0]}
        opacity={0.55}
        scale={22}
        blur={2.8}
        far={12}
      />
      <Environment preset="apartment" environmentIntensity={0.4} />
      <OrbitControls
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        minDistance={18}
        maxDistance={50}
      />
    </Canvas>
  )
})
