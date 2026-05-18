export type GradientStop = { color: string; pos: number }

export type GradientPreset = {
  id: string
  label: string
  css: string
  angleDeg: number
  stops: GradientStop[]
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'cosmic',
    label: 'Cosmic',
    css: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
    angleDeg: 135,
    stops: [{ color: '#8B5CF6', pos: 0 }, { color: '#EC4899', pos: 1 }],
  },
  {
    id: 'ocean',
    label: 'Ocean',
    css: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
    angleDeg: 135,
    stops: [{ color: '#3B82F6', pos: 0 }, { color: '#06B6D4', pos: 1 }],
  },
  {
    id: 'sunset',
    label: 'Sunset',
    css: 'linear-gradient(135deg, #F97316, #EAB308)',
    angleDeg: 135,
    stops: [{ color: '#F97316', pos: 0 }, { color: '#EAB308', pos: 1 }],
  },
  {
    id: 'aurora',
    label: 'Aurora',
    css: 'linear-gradient(135deg, #10B981, #3B82F6)',
    angleDeg: 135,
    stops: [{ color: '#10B981', pos: 0 }, { color: '#3B82F6', pos: 1 }],
  },
  {
    id: 'flame',
    label: 'Flame',
    css: 'linear-gradient(135deg, #EF4444, #F97316)',
    angleDeg: 135,
    stops: [{ color: '#EF4444', pos: 0 }, { color: '#F97316', pos: 1 }],
  },
  {
    id: 'galaxy',
    label: 'Galaxy',
    css: 'linear-gradient(135deg, #4338CA, #7C3AED)',
    angleDeg: 135,
    stops: [{ color: '#4338CA', pos: 0 }, { color: '#7C3AED', pos: 1 }],
  },
  {
    id: 'midnight',
    label: 'Midnight',
    css: 'linear-gradient(135deg, #0F172A, #1E3A5F)',
    angleDeg: 135,
    stops: [{ color: '#0F172A', pos: 0 }, { color: '#1E3A5F', pos: 1 }],
  },
  {
    id: 'blush',
    label: 'Blush',
    css: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
    angleDeg: 135,
    stops: [{ color: '#ffecd2', pos: 0 }, { color: '#fcb69f', pos: 1 }],
  },
]

export function isGradientBg(bg: string): boolean {
  return bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient')
}

/**
 * Draws a CSS linear-gradient string onto a 2D canvas context.
 * Uses the gradient preset's angle and stops for the canvas gradient.
 */
export function drawGradientToCtx(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  preset: GradientPreset,
): void {
  // CSS gradient angle: clockwise from "to top"
  // Canvas vector (Y-down): dx = sin(angle), dy = -cos(angle)
  const rad = (preset.angleDeg * Math.PI) / 180
  const dx = Math.sin(rad)
  const dy = -Math.cos(rad)

  // Project each corner onto the direction to find gradient line extent
  const hw = width / 2
  const hh = height / 2
  const corners: [number, number][] = [[0, 0], [width, 0], [0, height], [width, height]]
  const projections = corners.map(([x, y]) => (x - hw) * dx + (y - hh) * dy)
  const tStart = Math.min(...projections)
  const tEnd = Math.max(...projections)

  const x0 = hw + tStart * dx
  const y0 = hh + tStart * dy
  const x1 = hw + tEnd * dx
  const y1 = hh + tEnd * dy

  const grad = ctx.createLinearGradient(x0, y0, x1, y1)
  for (const stop of preset.stops) {
    grad.addColorStop(stop.pos, stop.color)
  }
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)
}

/**
 * Finds the GradientPreset that matches the given CSS string, if any.
 */
export function findGradientPreset(css: string): GradientPreset | undefined {
  return GRADIENT_PRESETS.find((g) => g.css === css)
}
