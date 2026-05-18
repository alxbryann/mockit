import * as THREE from 'three'
import type { ColorSpace } from 'three'

/** Flip Y for canvas (WebGL origin bottom-left). */
function readRenderTargetAsPng(
  gl: THREE.WebGLRenderer,
  rt: THREE.WebGLRenderTarget,
  width: number,
  height: number,
): string {
  const buf = new Uint8Array(width * height * 4)
  gl.readRenderTargetPixels(rt, 0, 0, width, height, buf)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D context unavailable')
  const imageData = ctx.createImageData(width, height)
  const rowBytes = width * 4
  for (let y = 0; y < height; y++) {
    const src = (height - 1 - y) * rowBytes
    const dst = y * rowBytes
    imageData.data.set(buf.subarray(src, src + rowBytes), dst)
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Renders one frame to an offscreen target at `width` × `height` (same framing as
 * the live view when aspect matches the current canvas).
 */
export type CaptureSceneOptions = {
  /** Opaque studio background vs alpha so the PNG can be composited */
  transparent?: boolean
}

export function captureSceneToPngDataUrl(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  options?: CaptureSceneOptions,
): string {
  const transparent = options?.transparent === true
  const prevBg = scene.background
  const prevClearColor = new THREE.Color()
  gl.getClearColor(prevClearColor)
  const prevClearAlpha = gl.getClearAlpha()

  if (transparent) {
    scene.background = null
    gl.setClearColor(0x000000, 0)
  }

  const rt = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    colorSpace: gl.outputColorSpace as ColorSpace,
    depthBuffer: true,
  })

  const exportCam = camera.clone() as THREE.PerspectiveCamera
  exportCam.aspect = width / height
  exportCam.updateProjectionMatrix()

  const prevTarget = gl.getRenderTarget()
  const prevXR = gl.xr.enabled
  try {
    gl.xr.enabled = false
    gl.setRenderTarget(rt)
    gl.render(scene, exportCam)
    gl.setRenderTarget(prevTarget)
    gl.xr.enabled = prevXR

    return readRenderTargetAsPng(gl, rt, width, height)
  } finally {
    if (transparent) {
      scene.background = prevBg
      gl.setClearColor(prevClearColor, prevClearAlpha)
    }
    rt.dispose()
  }
}

/** Longest side = `longSide`, other dimension from viewport aspect (CSS pixels). */
export function exportPixelSize(longSide: number, viewW: number, viewH: number): { w: number; h: number } {
  const vw = Math.max(1, viewW)
  const vh = Math.max(1, viewH)
  const aspect = vw / vh
  if (aspect >= 1) {
    const w = longSide
    const h = Math.max(1, Math.round(longSide / aspect))
    return { w, h }
  }
  const h = longSide
  const w = Math.max(1, Math.round(longSide * aspect))
  return { w, h }
}
