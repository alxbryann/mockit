import { useRef, useState } from 'react'
import { Scene } from './Scene'
import { useStore } from './store'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const {
    screenshot,
    screenLoadError,
    deviceColor,
    bgColor,
    autoRotate,
    setScreenshot,
    setScreenLoadError,
    setDeviceColor,
    setBgColor,
    setAutoRotate,
  } = useStore()
  const [exporting, setExporting] = useState(false)

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
    setExporting(true)
    requestAnimationFrame(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
      if (!canvas) return setExporting(false)
      const link = document.createElement('a')
      link.download = `mockup-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setExporting(false)
    })
  }

  return (
    <div className="h-full w-full grid grid-cols-[1fr_320px]">
      <div className="relative">
        <Scene ref={canvasRef} />
        <div className="absolute top-4 left-4 text-sm tracking-wide opacity-60">
          mockup3d <span className="opacity-40">— alpha</span>
        </div>
      </div>

      <aside className="border-l border-white/10 bg-neutral-950 p-6 flex flex-col gap-6 overflow-y-auto">
        <div>
          <h2 className="text-xs uppercase tracking-widest opacity-50 mb-2">Screen</h2>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full px-3 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90 transition"
          >
            {screenshot ? 'Replace screenshot' : 'Upload screenshot'}
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
              onClick={() => {
                setScreenshot(null)
                setScreenLoadError(null)
              }}
              className="mt-2 text-xs opacity-60 hover:opacity-100"
            >
              Clear
            </button>
          )}
          {screenLoadError && (
            <p className="mt-2 text-xs text-amber-400/90 leading-relaxed">{screenLoadError}</p>
          )}
        </div>

        <Field label="Device color">
          <ColorRow value={deviceColor} onChange={setDeviceColor} swatches={['#1a1a1a', '#e5e5e5', '#1d3a8a', '#7a1d1d', '#caa472']} />
        </Field>

        <Field label="Background">
          <ColorRow value={bgColor} onChange={setBgColor} swatches={['#0a0a0a', '#ffffff', '#1d3a8a', '#0e7a4f', '#caa472']} />
        </Field>

        <Field label="Animation">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
            />
            Auto-rotate
          </label>
        </Field>

        <div className="mt-auto pt-6 border-t border-white/10">
          <button
            onClick={exportPNG}
            disabled={exporting}
            className="w-full px-3 py-2.5 rounded-md bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : 'Export PNG'}
          </button>
          <p className="text-[11px] opacity-40 mt-2 leading-relaxed">
            No watermark. Drag the scene to reframe before exporting.
          </p>
        </div>
      </aside>
    </div>
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
      <h2 className="text-xs uppercase tracking-widest opacity-50 mb-2">{label}</h2>
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
  swatches: string[]
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {swatches.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`w-7 h-7 rounded-full border ${value === s ? 'border-white' : 'border-white/20'}`}
          style={{ background: s }}
          aria-label={s}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded-full bg-transparent cursor-pointer"
      />
    </div>
  )
}
