import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Landing from './Landing.tsx'
import './renderApi'  // Headless render API for Playwright automation

const MESH_BG = [
  'radial-gradient(60% 50% at 80% 10%, #ffd1f5 0%, transparent 60%)',
  'radial-gradient(50% 50% at 10% 30%, #c3e9ff 0%, transparent 55%)',
  'radial-gradient(70% 60% at 50% 100%, #d6ffe9 0%, transparent 60%)',
  'linear-gradient(180deg, #f4ecff 0%, #ffefe7 100%)',
].join(', ')

function Root() {
  const [inStudio, setInStudio] = useState(
    () => new URLSearchParams(location.search).has('studio'),
  )

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')!
    if (!inStudio) {
      html.dataset.theme = 'glass'
      html.style.background = MESH_BG
      html.style.height = 'auto'
      body.style.background = 'transparent'
      body.style.height = 'auto'
      body.style.minHeight = '100vh'
      body.style.color = 'var(--fg)'
      root.style.height = 'auto'
      root.style.minHeight = '100vh'
    } else {
      html.dataset.theme = 'dark'
      html.style.background = ''
      html.style.height = ''
      body.style.background = ''
      body.style.height = ''
      body.style.minHeight = ''
      body.style.color = ''
      root.style.height = ''
      root.style.minHeight = ''
    }
  }, [inStudio])

  if (inStudio) return <App />
  return <Landing onEnter={() => setInStudio(true)} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
