type Props = { onEnter: () => void }

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
    <svg viewBox="0 0 40 40" width={30} height={30} style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id="orb" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".9" />
          <stop offset=".4" stopColor="#c5b3ff" />
          <stop offset="1" stopColor="#6e4bff" />
        </radialGradient>
        <radialGradient id="blush" cx="65%" cy="65%" r="60%">
          <stop offset="0" stopColor="#ff7eb6" stopOpacity=".8" />
          <stop offset="1" stopColor="#ff7eb6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="17" fill="url(#orb)" />
      <circle cx="20" cy="20" r="17" fill="url(#blush)" />
      <ellipse cx="14" cy="12" rx="6" ry="3" fill="#fff" opacity=".55" />
    </svg>
    <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--fg)' }}>
      openmockup<span style={{ color: 'var(--accent)' }}>.ai</span>
    </span>
  </div>
)

const navLinks = ['Features', 'Gallery', 'Templates', 'Pricing', 'Changelog']

const logos = ['Linear', 'Vercel', 'Arc', 'Raycast', 'Framer', 'Notion']

const features = [
  {
    icon: '◐',
    color: '#6e4bff',
    title: 'Real-time 3D',
    body: 'Drag, rotate, light. No render queue, no waiting. The viewport is the mockup.',
  },
  {
    icon: '▢',
    color: '#6e4bff',
    title: '30+ devices',
    body: 'iPhone, Mac, iPad, Watch, Vision Pro, and more. Every angle, every color.',
  },
  {
    icon: '✦',
    color: '#6e4bff',
    title: 'Motion mockups',
    body: 'Record screen captures inside the device. Export as GIF or Lottie in one click.',
  },
]

const gallery = [
  { handle: '@studio_nox', img: '/gallery/g1.png' },
  { handle: '@studio_ema', img: '/gallery/g2.png' },
  { handle: '@studio_ari', img: '/gallery/g3.png' },
]

// Minimal CSS phone shape rendered with divs
function PhoneShape({ scale = 1, tilt = 0 }: { scale?: number; tilt?: number }) {
  const w = 160 * scale
  const h = 320 * scale
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: w * 0.14,
        background: 'rgba(20,10,40,.85)',
        border: '6px solid rgba(255,255,255,.15)',
        boxShadow: '0 40px 80px rgba(110,75,255,.35), 0 8px 24px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.15)',
        position: 'relative',
        transform: `rotate(${tilt}deg)`,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Dynamic island */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        width: w * 0.28, height: 10 * scale, borderRadius: 999,
        background: '#000',
      }} />
      {/* Screen content placeholder */}
      <div style={{ position: 'absolute', inset: '28px 8px 8px', borderRadius: w * 0.09, background: 'rgba(255,255,255,.06)', padding: 10 }}>
        <div style={{ fontSize: 7 * scale, color: 'rgba(255,255,255,.45)', marginBottom: 4 }}>Tuesday, May 17</div>
        <div style={{ fontSize: 11 * scale, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Good morning</div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.08)', marginBottom: 8 }} />
        <div style={{ fontSize: 7 * scale, color: 'rgba(255,255,255,.4)', marginBottom: 3 }}>FOCUS</div>
        <div style={{ fontSize: 9 * scale, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Ship landing redesign</div>
        <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 18 * scale, borderRadius: 4, background: 'var(--accent)' }} />)}
        </div>
        {['Review motion specs', 'Sync with design team', 'Polish hero animation'].map((t, i) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <div style={{ width: 8 * scale, height: 8 * scale, borderRadius: '50%', border: i === 0 ? 'none' : '1.5px solid rgba(255,255,255,.3)', background: i === 0 ? 'var(--accent)' : 'transparent', flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 7 * scale, color: i === 0 ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.7)', textDecoration: i === 0 ? 'line-through' : 'none' }}>{t}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MacShape() {
  const w = 260
  const h = 170
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        width: w, height: h,
        borderRadius: '10px 10px 4px 4px',
        background: 'rgba(20,10,40,.8)',
        border: '4px solid rgba(255,255,255,.12)',
        boxShadow: '0 20px 60px rgba(110,75,255,.2)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* traffic lights */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 10px 0' }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ padding: '6px 10px 8px', fontSize: 9, color: 'rgba(255,255,255,.5)' }}>Pages · Components · Devices · Assets · Exports</div>
        <div style={{ margin: '0 8px', height: 1, background: 'rgba(255,255,255,.06)' }} />
        <div style={{ display: 'flex', height: h - 60 }}>
          <div style={{ width: 60, borderRight: '1px solid rgba(255,255,255,.06)', padding: '8px 6px', fontSize: 8, color: 'rgba(255,255,255,.3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {['Pages','Components','Devices','Assets','Exports'].map((t, i) => (
              <div key={t} style={{ color: i === 2 ? 'var(--accent)' : 'inherit', fontWeight: i === 2 ? 600 : 400, fontSize: 8 }}>{t}</div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,.2)' }}>PROJECT</div>
          </div>
        </div>
      </div>
      {/* base */}
      <div style={{ width: w + 20, height: 8, background: 'rgba(20,10,40,.6)', borderRadius: '0 0 8px 8px', margin: '0 auto', transform: 'translateX(-10px)' }} />
      <div style={{ width: w * 0.5, height: 3, background: 'rgba(20,10,40,.4)', borderRadius: 4, margin: '0 auto' }} />
    </div>
  )
}

export default function Landing({ onEnter }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'var(--font-sans)',
      color: 'var(--fg)',
      WebkitFontSmoothing: 'antialiased',
      position: 'relative',
    }}>
      {/* Fixed background covers entire viewport at all scroll depths */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background: `
          radial-gradient(60% 50% at 80% 10%, #ffd1f5 0%, transparent 60%),
          radial-gradient(50% 50% at 10% 30%, #c3e9ff 0%, transparent 55%),
          radial-gradient(70% 60% at 50% 100%, #d6ffe9 0%, transparent 60%),
          linear-gradient(180deg, #f4ecff 0%, #ffefe7 100%)
        `,
        pointerEvents: 'none',
      }} />

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '0 var(--gutter)',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,.5)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        backdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {navLinks.map(l => (
            <button key={l} style={{
              padding: '6px 12px', border: 'none', background: 'transparent',
              font: '500 14px/1 var(--font-sans)', color: 'var(--fg-2)',
              cursor: 'pointer', borderRadius: 'var(--radius)', letterSpacing: '-0.005em',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-2)')}
            >{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{
            padding: '8px 16px', border: '1px solid var(--border-2)',
            background: 'var(--surface)', borderRadius: 999,
            font: '500 14px/1 var(--font-sans)', color: 'var(--fg)',
            cursor: 'pointer',
            WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)',
          }}>Sign in</button>
          <button onClick={onEnter} style={{
            padding: '8px 18px', border: 'none',
            background: 'var(--accent)', borderRadius: 999,
            font: '600 14px/1 var(--font-sans)', color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 4px 14px -4px var(--accent-glow)',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'filter .15s ease, transform .15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = '' }}
          >Open studio <span style={{ fontSize: 13 }}>↗</span></button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        padding: '100px var(--gutter) 80px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 48, maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
        position: 'relative',
      }}>
        {/* Left */}
        <div style={{ flex: '0 0 auto', maxWidth: 520 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 500,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--fg-2)', marginBottom: 28,
          }}>✦ Now with motion mockups</div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(52px, 5.5vw, 90px)',
            lineHeight: 0.96, letterSpacing: 'var(--letter-display)',
            margin: '0 0 24px', color: 'var(--fg)',
          }}>
            Mockups{' '}
            <span style={{
              background: 'linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3))',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>that pop.</span>
            <br />Made in seconds.
          </h1>

          <p style={{
            fontSize: 18, lineHeight: 1.55, color: 'var(--fg-2)',
            letterSpacing: '-0.005em', margin: '0 0 40px', maxWidth: 440,
          }}>
            Drag your screens into beautifully lit iPhones and Macs.
            No Blender. No render queue. Just gorgeous mockups in a tab.
          </p>

          <button onClick={onEnter} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 24px', borderRadius: 999, border: 'none',
            background: 'var(--accent)', color: '#fff',
            font: '600 16px/1 var(--font-sans)', letterSpacing: '-0.005em',
            cursor: 'pointer',
            boxShadow: '0 6px 20px -6px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,.25)',
            transition: 'filter .15s ease, transform .15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.06)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = '' }}
          >Start a mockup →</button>
        </div>

        {/* Right — device cluster */}
        <div style={{
          flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', minHeight: 420,
        }}>
          {/* Glow blobs behind devices */}
          <div style={{
            position: 'absolute', width: 340, height: 340, borderRadius: '50%',
            filter: 'blur(70px)', opacity: 0.5,
            background: 'radial-gradient(circle, #ff7eb6 0%, transparent 70%)',
            top: '5%', right: '10%', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', width: 280, height: 280, borderRadius: '50%',
            filter: 'blur(60px)', opacity: 0.4,
            background: 'radial-gradient(circle, #6e4bff 0%, transparent 70%)',
            bottom: '5%', left: '5%', pointerEvents: 'none',
          }} />

          {/* MacBook behind */}
          <div style={{ position: 'absolute', left: '2%', bottom: '8%', zIndex: 1, opacity: 0.9 }}>
            <MacShape />
          </div>
          {/* iPhone front */}
          <div style={{ position: 'relative', zIndex: 2, transform: 'rotate(-5deg) translateY(-10px)' }}>
            <PhoneShape scale={1.15} />
          </div>
        </div>
      </section>

      {/* ── Logos ── */}
      <div style={{
        borderTop: '1px solid var(--border-2)', borderBottom: '1px solid var(--border-2)',
        padding: '24px var(--gutter)',
        display: 'flex', alignItems: 'center', gap: 48,
        maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'var(--fg-3)', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
          Trusted by teams at
        </span>
        <div style={{ display: 'flex', gap: 40, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
          {logos.map(l => (
            <span key={l} style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-3)', letterSpacing: '-0.01em' }}>{l}</span>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section style={{ padding: '100px var(--gutter)', maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: 56 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 500,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--fg-2)', marginBottom: 20,
          }}>Why teams love it</div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(36px, 4vw, 60px)', letterSpacing: '-0.04em', lineHeight: 1.02,
            margin: 0, color: 'var(--fg)',
          }}>
            Every angle, every backdrop,<br />every device.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {features.map(f => (
            <div key={f.title}
              style={{
                background: 'var(--surface)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                backdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-1)',
                padding: '32px 28px 36px',
                transition: 'transform .2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#fff', marginBottom: 20,
                boxShadow: `0 6px 16px -4px ${f.color}88`,
              }}>{f.icon}</div>
              <h3 style={{ fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em', margin: '0 0 10px', color: 'var(--fg)' }}>{f.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--fg-2)', margin: 0 }}>{f.body}</p>
              <button style={{
                marginTop: 20, padding: 0, border: 'none', background: 'none',
                font: '500 14px/1 var(--font-sans)', color: 'var(--accent)',
                cursor: 'pointer', letterSpacing: '-0.005em',
              }}>Learn more →</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gallery ── */}
      <section style={{ padding: '0 var(--gutter) 100px', maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px, 3vw, 44px)', letterSpacing: '-0.04em', margin: 0, color: 'var(--fg)' }}>
            See it in action
          </h2>
          <button style={{
            padding: '10px 18px', borderRadius: 999,
            border: '1px solid var(--border-2)', background: 'var(--surface)',
            font: '500 14px/1 var(--font-sans)', color: 'var(--fg)',
            cursor: 'pointer',
            WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)',
          }}>Explore gallery →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {gallery.map(g => (
            <div key={g.handle}
              style={{
                borderRadius: 'var(--radius-lg)',
                background: '#0a0614',
                height: 340,
                position: 'relative', overflow: 'hidden',
                boxShadow: 'var(--shadow-1)',
                transition: 'transform .2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}
            >
              <img
                src={g.img}
                alt={`Mockup by ${g.handle}`}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <div style={{ position: 'absolute', top: 16, left: 16 }}>
                <span style={{
                  padding: '5px 11px', borderRadius: 999,
                  background: 'rgba(0,0,0,.35)',
                  fontSize: 12, fontWeight: 500, color: '#fff',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,.15)',
                }}>{g.handle}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{
        padding: '0 var(--gutter) 120px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        <div style={{
          background: 'var(--surface)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          backdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-2)',
          padding: '72px 80px',
          maxWidth: 720, width: '100%',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(36px, 4vw, 60px)', letterSpacing: '-0.04em', lineHeight: 1.02,
            margin: '0 0 16px', color: 'var(--fg)',
          }}>
            Make your product look<br />as good as it is.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--fg-2)', margin: '0 0 40px' }}>
            Free while in beta. No card, no email gate. Just open the studio and drop a screen.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={onEnter} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 999, border: 'none',
              background: 'var(--accent)', color: '#fff',
              font: '600 16px/1 var(--font-sans)', letterSpacing: '-0.005em',
              cursor: 'pointer',
              boxShadow: '0 6px 20px -6px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,.25)',
              transition: 'filter .15s ease, transform .15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.06)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = '' }}
            >Open openmockup.ai →</button>
            <button style={{
              padding: '14px 22px', borderRadius: 999,
              border: '1px solid var(--border-2)', background: 'var(--surface-2)',
              font: '500 16px/1 var(--font-sans)', color: 'var(--fg)',
              cursor: 'pointer',
            }}>See pricing</button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: '20px 0 0' }}>
            Works in your browser · No install required
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border-2)',
        padding: '28px var(--gutter)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        <Logo />
        <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Built with care in Berlin &amp; Bogotá</span>
      </footer>
    </div>
  )
}
