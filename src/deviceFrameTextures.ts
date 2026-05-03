import * as THREE from 'three'

export type FrameTextureVariant = 'titanium' | 'aluminum'

type CachedMaps = {
  roughnessMap: THREE.CanvasTexture
  normalMap: THREE.CanvasTexture
}

const cache: Partial<Record<FrameTextureVariant, CachedMaps>> = {}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

function grain01(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

function makeCanvasTexture(
  putPixels: (ctx: CanvasRenderingContext2D, size: number) => void,
  repeatU: number,
  repeatV: number,
) {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(repeatU, repeatV)
    tex.colorSpace = THREE.NoColorSpace
    return tex
  }
  putPixels(ctx, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatU, repeatV)
  tex.anisotropy = 16
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

/**
 * `titanium`: mate más cerrado (negro / titanio).
 * `aluminum`: rugosidad media‑baja + rayas más marcadas → brillos alargados tipo aluminio cepillado (natural, plateado).
 */
export function getDeviceFrameSurfaceMaps(variant: FrameTextureVariant): CachedMaps {
  const hit = cache[variant]
  if (hit) return hit

  const baseRough = variant === 'titanium' ? 0.58 : 0.46
  const brushAmp = variant === 'titanium' ? 0.045 : 0.068
  const fineAmp = variant === 'titanium' ? 0.028 : 0.034
  const normalMul = variant === 'titanium' ? 1.15 : 1.35
  const brushNx = variant === 'titanium' ? 48 : 56

  const roughnessMap = makeCanvasTexture(
    (ctx, size) => {
      const img = ctx.createImageData(size, size)
      for (let y = 0; y < size; y++) {
        const ny = y / size
        for (let x = 0; x < size; x++) {
          const nx = x / size
          const i = (y * size + x) * 4
          const brush = Math.sin(nx * Math.PI * brushNx + ny * Math.PI * 3) * brushAmp
          const fine = (grain01(x, y) - 0.5) * fineAmp
          const slow = Math.sin(nx * Math.PI * 6 + ny * Math.PI * 14) * 0.012
          const rough = clamp01(baseRough + brush + fine + slow)
          const byte = Math.round(rough * 255)
          img.data[i] = byte
          img.data[i + 1] = byte
          img.data[i + 2] = byte
          img.data[i + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
    },
    5,
    8,
  )

  const normalMap = makeCanvasTexture(
    (ctx, size) => {
      const img = ctx.createImageData(size, size)
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const nx = x / size
          const i = (y * size + x) * 4
          const hL = grain01(x - 1, y)
          const hR = grain01(x + 1, y)
          const hD = grain01(x, y - 1)
          const hU = grain01(x, y + 1)
          let dx = (hL - hR) * normalMul
          let dy = (hD - hU) * normalMul
          dx += Math.sin(nx * Math.PI * 64) * (variant === 'titanium' ? 0.06 : 0.085)
          const nz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy))
          img.data[i] = Math.round((dx * 0.5 + 0.5) * 255)
          img.data[i + 1] = Math.round((dy * 0.5 + 0.5) * 255)
          img.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255)
          img.data[i + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
    },
    5,
    8,
  )

  const maps = { roughnessMap, normalMap }
  cache[variant] = maps
  return maps
}

export function frameMaterialLuminance(deviceColor: string): number {
  const c = new THREE.Color(deviceColor)
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
}

/** Saturación aproximada en [0,1]; baja en grises / plateados. */
export function frameColorSaturation(deviceColor: string): number {
  const c = new THREE.Color(deviceColor)
  const max = Math.max(c.r, c.g, c.b)
  const min = Math.min(c.r, c.g, c.b)
  if (max <= 1e-6) return 0
  return (max - min) / max
}
