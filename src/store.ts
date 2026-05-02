import { create } from 'zustand'

type State = {
  screenshot: string | null
  screenLoadError: string | null
  deviceColor: string
  bgColor: string
  autoRotate: boolean
  setScreenshot: (s: string | null) => void
  setScreenLoadError: (s: string | null) => void
  setDeviceColor: (c: string) => void
  setBgColor: (c: string) => void
  setAutoRotate: (v: boolean) => void
}

export const useStore = create<State>((set) => ({
  screenshot: null,
  screenLoadError: null,
  deviceColor: '#1a1a1a',
  bgColor: '#0a0a0a',
  autoRotate: true,
  setScreenshot: (s) => set({ screenshot: s }),
  setScreenLoadError: (msg) => set({ screenLoadError: msg }),
  setDeviceColor: (c) => set({ deviceColor: c }),
  setBgColor: (c) => set({ bgColor: c }),
  setAutoRotate: (v) => set({ autoRotate: v }),
}))
