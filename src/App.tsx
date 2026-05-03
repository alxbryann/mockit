import { useEffect, useRef, useState } from 'react'
import { exportPixelSize } from './highResCapture'
import { Scene } from './Scene'
import { useStore } from './store'

type ExportPreset = 'screen' | 1920 | 3840 | 7680

const EXPORT_PRESETS: { id: ExportPreset; label: string; hint: string }[] = [
  { id: 'screen', label: 'Pantalla', hint: 'rápido, tamaño del visor' },
  { id: 1920, label: '1080p', hint: 'lado largo 1920 px' },
  { id: 3840, label: '4K', hint: 'lado largo 3840 px' },
  { id: 7680, label: '8K', hint: 'lado largo 7680 px' },
]

const DEVICE_SWATCHES = ['#1a1a1a', '#e8e8e8', '#1e3a5f', '#8b2222', '#c9a227', '#b4b8c0'] as const
const BG_SWATCHES = ['#0a0a0a', '#ffffff', '#0f172a', '#14532d', '#5c4033', '#f4f4f5'] as const

export default function App() {
  const fileRef = useRef<HTMLInputElement>(null)
  const {
    screenshot,
    screenLoadError,
    deviceColor,
    bgColor,
    autoRotate,
    uiTheme,
    cameraRoll,
    setScreenshot,
    setScreenLoadError,
    setDeviceColor,
    setBgColor,
    setAutoRotate,
    setUiTheme,
    setCameraRoll,
    toggleCameraPanFree,
  } = useStore()
  const [exporting, setExporting] = useState(false)
  const [exportPreset, setExportPreset] = useState<ExportPreset>(3840)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = uiTheme
  }, [uiTheme])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented) return
      const el = e.target as HTMLElement | null
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.key !== 'h' && e.key !== 'H') return
      e.preventDefault()
      toggleCameraPanFree()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleCameraPanFree])

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setScreenLoadError(null)

    const isHeic =
      /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)

    try {
      let dataUrl: string
      if (isHeic) {
        const heic2any = (await import('heic2any')).default
        const converted = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.92,
        })
        const blob = Array.isArray(converted) ? converted[0] : converted
        dataUrl = await readBlobAsDataUrl(blob)
      } else {
        dataUrl = await readFileAsDataUrl(file)
      }
      setScreenshot(dataUrl)
    } catch (err) {
      console.error(err)
      setScreenLoadError(
        isHeic
          ? 'No se pudo convertir HEIC. Exporta la captura como JPEG o PNG e inténtalo de nuevo.'
          : 'No se pudo leer el archivo.',
      )
    }
  }

  function exportPNG() {
    setExportError(null)
    setExporting(true)
    requestAnimationFrame(() => {
      try {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
        if (!canvas) {
          setExportError('No se encontró el lienzo 3D.')
          return
        }
        const capture = useStore.getState().captureSceneAtSize
        let dataUrl: string
        if (exportPreset !== 'screen' && capture) {
          const { w, h } = exportPixelSize(exportPreset, canvas.clientWidth, canvas.clientHeight)
          const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
          if (gl) {
            const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
            if (w > maxTex || h > maxTex) {
              setExportError(`Esta GPU admite como mucho ${maxTex}px por lado. Elige otra resolución.`)
              return
            }
          }
          dataUrl = capture(w, h)
        } else {
          dataUrl = canvas.toDataURL('image/png')
        }
        const link = document.createElement('a')
        link.download = `mockit-${Date.now()}.png`
        link.href = dataUrl
        link.click()
      } catch (err) {
        console.error(err)
        setExportError('No se pudo exportar. Prueba “Pantalla” o una resolución menor.')
      } finally {
        setExporting(false)
      }
    })
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col" style={{ background: 'var(--mockit-bg)' }}>
      <header
        className="flex h-14 shrink-0 items-center justify-between border-b px-5"
        style={{ borderColor: 'var(--mockit-nav-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <PhoneGlyph className="h-[22px] w-[22px] shrink-0 text-[var(--mockit-accent-bright)]" />
          <span
            className="text-[1.15rem] font-light lowercase tracking-tight"
            style={{ color: 'var(--mockit-text)' }}
          >
            mockit
          </span>
        </div>
        <button
          type="button"
          onClick={() => setUiTheme(uiTheme === 'dark' ? 'light' : 'dark')}
          className="flex cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0"
          aria-label={uiTheme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'}
        >
          <span className="mockit-toggle" data-on={uiTheme === 'light'}>
            <span className="mockit-toggle-thumb" />
          </span>
          <span className="font-script text-[1.35rem] leading-none" style={{ color: 'var(--mockit-script)' }}>
            {uiTheme === 'dark' ? 'light' : 'dark'}
          </span>
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <Scene />
        <p
          className="pointer-events-none absolute bottom-4 left-5 select-none font-script text-[1.15rem] md:text-[1.25rem]"
          style={{ color: 'var(--mockit-script)' }}
        >
          arrastra: órbita · rueda: zoom · H: modo desplazar XY (mano: arrastra con clic principal) · H otra vez: salir
        </p>

        <aside
          className="absolute top-1/2 right-4 z-10 w-[min(100%-1.5rem,300px)] max-h-[calc(100%-1.5rem)] -translate-y-1/2 overflow-y-auto rounded-2xl border p-5 shadow-xl md:right-6 md:w-[min(100%-3rem,320px)]"
          style={{
            background: 'var(--mockit-panel)',
            borderColor: 'var(--mockit-panel-border)',
            boxShadow: 'var(--mockit-shadow)',
          }}
        >
          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-7 transition hover:border-[var(--mockit-accent)] hover:bg-[var(--mockit-accent)]/5"
              style={{ borderColor: 'var(--mockit-upload-dash)' }}
            >
              <span className="font-script text-[1.35rem]" style={{ color: 'var(--mockit-script)' }}>
                {screenshot ? '+ replace screenshot' : '+ upload screenshot'}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onUpload}
            />

            {screenshot && (
              <button
                type="button"
                onClick={() => {
                  setScreenshot(null)
                  setScreenLoadError(null)
                }}
                className="font-script -mt-2 self-center text-base opacity-70 hover:opacity-100"
                style={{ color: 'var(--mockit-script)' }}
              >
                Clear
              </button>
            )}
            {screenLoadError && (
              <p className="text-xs leading-relaxed text-amber-600 dark:text-amber-400/90">{screenLoadError}</p>
            )}

            <Field label="Device color">
              <ColorRow value={deviceColor} onChange={setDeviceColor} swatches={[...DEVICE_SWATCHES]} />
            </Field>

            <Field label="Background">
              <ColorRow value={bgColor} onChange={setBgColor} swatches={[...BG_SWATCHES]} />
            </Field>

            <div className="flex items-center justify-between gap-3">
              <span className="font-script text-[1.25rem]" style={{ color: 'var(--mockit-script)' }}>
                auto-rotate
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={autoRotate}
                onClick={() => setAutoRotate(!autoRotate)}
                className="border-0 bg-transparent p-0"
              >
                <span className="mockit-toggle" data-on={autoRotate}>
                  <span className="mockit-toggle-thumb" />
                </span>
              </button>
            </div>

            <Field label="Camera roll">
              <p className="mb-2 font-script text-[0.95rem] leading-snug opacity-80" style={{ color: 'var(--mockit-script)' }}>
                Gira la vista alrededor del eje de la cámara. Combina con arrastrar la escena.
              </p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {(
                  [
                    { rad: 0, label: '0°' },
                    { rad: Math.PI / 2, label: '90°' },
                    { rad: Math.PI, label: '180°' },
                    { rad: -Math.PI / 2, label: '270°' },
                  ] as const
                ).map(({ rad, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setCameraRoll(rad)}
                    className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                      Math.abs(cameraRoll - rad) < 0.02
                        ? 'border-[var(--mockit-accent-bright)] bg-[var(--mockit-accent)]/15 text-[var(--mockit-text)]'
                        : 'border-[color-mix(in_srgb,var(--mockit-text)_18%,transparent)] hover:border-[var(--mockit-accent)]/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-3 text-xs" style={{ color: 'var(--mockit-text-muted)' }}>
                <span className="w-12 shrink-0 tabular-nums">
                  {Math.round((cameraRoll * 180) / Math.PI)}°
                </span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={Math.round((cameraRoll * 180) / Math.PI)}
                  onChange={(e) => setCameraRoll((Number(e.target.value) * Math.PI) / 180)}
                  className="min-w-0 flex-1 accent-[var(--mockit-accent-bright)]"
                />
              </label>
            </Field>

            <div className="pt-1">
              <p
                className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: 'var(--mockit-text-muted)' }}
              >
                Export resolution
              </p>
              <div className="mb-3 grid grid-cols-2 gap-2">
                {EXPORT_PRESETS.map(({ id, label }) => {
                  const on = exportPreset === id
                  return (
                    <button
                      key={String(id)}
                      type="button"
                      onClick={() => {
                        setExportPreset(id)
                        setExportError(null)
                      }}
                      className={`rounded-lg border px-2 py-2 text-xs transition ${
                        on
                          ? 'border-[var(--mockit-accent-bright)] bg-[var(--mockit-accent)]/15 text-[var(--mockit-text)]'
                          : 'border-[color-mix(in_srgb,var(--mockit-text)_18%,transparent)] hover:border-[var(--mockit-accent)]/50'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <p className="mb-3 text-[11px] leading-snug opacity-80" style={{ color: 'var(--mockit-text-muted)' }}>
                {EXPORT_PRESETS.find((p) => p.id === exportPreset)?.hint}. Misma composición que el visor; PNG sin pérdida.
              </p>
              <button
                type="button"
                onClick={exportPNG}
                disabled={exporting}
                className="w-full cursor-pointer rounded-xl py-3.5 text-[15px] font-bold tracking-wide text-slate-900 italic transition enabled:hover:brightness-110 disabled:opacity-50"
                style={{
                  background: 'var(--mockit-accent-bright)',
                  boxShadow: '0 0 28px rgba(34, 211, 238, 0.28)',
                }}
              >
                {exporting ? 'Exporting…' : 'Export PNG'}
              </button>
              {exportError && (
                <p className="mt-2 text-center text-xs leading-relaxed text-amber-600 dark:text-amber-400/90">
                  {exportError}
                </p>
              )}
              <p className="mt-2 font-script text-center text-[0.95rem] opacity-70" style={{ color: 'var(--mockit-script)' }}>
                No watermark — reframe before export
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PhoneGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="6.5" y="3" width="11" height="18" rx="2.2" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="12" cy="17.25" r="0.55" fill="currentColor" />
    </svg>
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: 'var(--mockit-text-muted)' }}
      >
        {label}
      </h2>
      {children}
    </div>
  )
}

function ColorRow({
  value,
  onChange,
  swatches,
}: {
  value: string
  onChange: (v: string) => void
  swatches: readonly string[] | string[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {swatches.map((s) => {
        const selected = value.toLowerCase() === s.toLowerCase()
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`h-8 w-8 rounded-full border-2 transition ${
              selected
                ? 'scale-105 border-[var(--mockit-accent-bright)] shadow-[0_0_14px_rgba(34,211,238,0.4)]'
                : 'border-[color-mix(in_srgb,var(--mockit-text)_22%,transparent)] hover:border-[var(--mockit-accent)]/55'
            }`}
            style={{ background: s }}
            aria-label={`Color ${s}`}
          />
        )
      })}
    </div>
  )
}
