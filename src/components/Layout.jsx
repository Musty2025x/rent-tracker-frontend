import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/helpers'

const NAV = [
  { to: '/',           icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { to: '/properties', icon: 'ti-building-estate',  label: 'Properties' },
  { to: '/payments',   icon: 'ti-cash',             label: 'Payments' },
  { to: '/reminders',  icon: 'ti-bell',             label: 'Reminders' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [drawer, setDrawer] = useState(false)
  const [mobile, setMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawer])

  function handleLogout() { logout(); navigate('/login') }

  const pageTitle = NAV.find(n =>
    n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
  )?.label || 'Rent Tracker'

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Desktop sidebar ── */}
      {!mobile && (
        <aside style={{
          width: 220, flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          height: '100dvh', overflowY: 'auto',
        }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-building" style={{ fontSize: 17, color: '#fff' }} />
              </div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Rent Tracker</span>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '1rem .75rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', borderRadius: 'var(--radius)',
                  fontSize: 13, fontWeight: 500, textDecoration: 'none',
                  color: isActive ? 'var(--blue)' : 'var(--text-2)',
                  background: isActive ? 'var(--blue-bg)' : 'transparent',
                })}>
                <i className={`ti ${icon}`} style={{ fontSize: 17 }} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div style={{ padding: '.75rem 1rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                {initials(user?.name || '')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-sm"
              style={{ width: '100%', justifyContent: 'center', color: 'var(--text-2)' }}>
              <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign out
            </button>
          </div>
        </aside>
      )}

      {/* ── Mobile: drawer backdrop ── */}
      {mobile && drawer && (
        <div
          onClick={() => setDrawer(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.5)',
            zIndex: 300,
          }}
        />
      )}

      {/* ── Mobile: slide-in drawer ── */}
      {mobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 270,
          background: 'var(--surface)',
          zIndex: 301,
          display: 'flex', flexDirection: 'column',
          transform: drawer ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .22s ease',
          boxShadow: drawer ? '6px 0 30px rgba(0,0,0,.18)' : 'none',
          // CRITICAL: when hidden, drawer must not intercept any touches
          pointerEvents: drawer ? 'auto' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-building" style={{ fontSize: 15, color: '#fff' }} />
              </div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Rent Tracker</span>
            </div>
            <button onClick={() => setDrawer(false)}
              style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer' }}>
              <i className="ti ti-x" style={{ fontSize: 22, color: 'var(--text-2)' }} />
            </button>
          </div>

          <nav style={{ flex: 1, padding: '1rem .75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                onClick={() => setDrawer(false)}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 12px', borderRadius: 'var(--radius)',
                  fontSize: 15, fontWeight: 500, textDecoration: 'none',
                  color: isActive ? 'var(--blue)' : 'var(--text-2)',
                  background: isActive ? 'var(--blue-bg)' : 'transparent',
                })}>
                <i className={`ti ${icon}`} style={{ fontSize: 22 }} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div className="avatar" style={{ width: 38, height: 38, fontSize: 13 }}>
                {initials(user?.name || '')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </div>
            <button onClick={() => { handleLogout(); setDrawer(false) }}
              className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* ── Main content column ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0, height: '100dvh', overflow: 'hidden',
        // CRITICAL: always on top of the hidden drawer
        position: 'relative', zIndex: 1,
      }}>

        {/* Mobile top bar */}
        {mobile && (
          <header style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem', height: 54, flexShrink: 0,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
          }}>
            <button
              onClick={() => setDrawer(true)}
              style={{
                background: 'none', border: 'none',
                padding: '8px 4px', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                WebkitTapHighlightColor: 'transparent',
              }}>
              <i className="ti ti-menu-2" style={{ fontSize: 24, color: 'var(--text)' }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-building" style={{ fontSize: 14, color: '#fff' }} />
              </div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{pageTitle}</span>
            </div>

            <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
              {initials(user?.name || '')}
            </div>
          </header>
        )}

        {/* Scrollable page content */}
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: mobile ? '1rem' : '2rem',
          WebkitOverflowScrolling: 'touch',
        }}>
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        {mobile && (
          <nav style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>
            {NAV.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 2,
                  padding: '8px 4px',
                  textDecoration: 'none',
                  color: isActive ? 'var(--blue)' : 'var(--text-3)',
                  WebkitTapHighlightColor: 'transparent',
                })}>
                {({ isActive }) => (
                  <>
                    <div style={{
                      width: 40, height: 26, borderRadius: 13,
                      background: isActive ? 'var(--blue-bg)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`ti ${icon}`} style={{ fontSize: 20 }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}
