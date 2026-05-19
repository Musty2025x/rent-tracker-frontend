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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile]     = useState(() => window.innerWidth <= 768)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const title = NAV.find(n =>
    n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
  )?.label ?? 'Rent Tracker'

  const handleLogout = () => { logout(); navigate('/login') }

  const renderNav = (onNav) => NAV.map(({ to, icon, label }) => (
    <NavLink key={to} to={to} end={to === '/'}
      onClick={onNav}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 14px', borderRadius: 10, margin: '1px 0',
        fontSize: 14, fontWeight: 600, textDecoration: 'none',
        color: isActive ? 'var(--navy)' : 'rgba(255,255,255,.82)',
        background: isActive ? '#ffffff' : 'transparent',
      })}>
      <i className={`ti ${icon}`} style={{ fontSize: 18, flexShrink: 0 }} />
      {label}
    </NavLink>
  ))

  /* ── DESKTOP ── */
  if (!isMobile) {
    return (
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <aside style={{ width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: 'var(--navy)' }}>
          <div style={{ padding: '1.4rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-building" style={{ fontSize: 18, color: 'var(--navy)' }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Rent Tracker</span>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '1rem .85rem', display: 'flex', flexDirection: 'column' }}>
            {renderNav(null)}
          </nav>
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                {initials(user?.name || '')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,.22)', background: 'transparent', color: 'rgba(255,255,255,.82)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
              <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign out
            </button>
          </div>
        </aside>
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: 'var(--bg)', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    )
  }

  /* ── MOBILE ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Top bar — navy, full width, hamburger always visible */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', height: 56, flexShrink: 0,
        background: 'var(--navy)', width: '100%',
      }}>
        {/* Hamburger — left side */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            background: 'none', border: 'none',
            width: 40, height: 40, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}>
          <i className="ti ti-menu-2" style={{ fontSize: 26, color: '#ffffff' }} />
        </button>

        {/* Title — centre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-building" style={{ fontSize: 14, color: 'var(--navy)' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{title}</span>
        </div>

        {/* Avatar — right side, tapping opens drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,.22)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
            flexShrink: 0, WebkitTapHighlightColor: 'transparent',
          }}>
          {initials(user?.name || '')}
        </button>
      </header>

      {/* Scrollable content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--bg)', minWidth: 0, minHeight: 0 }}>
        <Outlet />
      </main>

      {/* Bottom nav — 4 tabs */}
      <nav style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        background: 'var(--navy)', flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,.1)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '8px 4px', textDecoration: 'none',
              color: isActive ? '#fff' : 'rgba(255,255,255,.5)',
              WebkitTapHighlightColor: 'transparent',
            })}>
            {({ isActive }) => (
              <>
                <div style={{ width: 44, height: 28, borderRadius: 14, background: isActive ? 'rgba(255,255,255,.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${icon}`} style={{ fontSize: 20 }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Drawer — only in DOM when open */}
      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,.65)', zIndex: 400 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 270, background: 'var(--navy)', zIndex: 401, display: 'flex', flexDirection: 'column' }}>

            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-building" style={{ fontSize: 17, color: 'var(--navy)' }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Rent Tracker</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'rgba(255,255,255,.7)', display: 'flex', fontFamily: 'inherit' }}>
                <i className="ti ti-x" style={{ fontSize: 22 }} />
              </button>
            </div>

            {/* User info at top of drawer */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {initials(user?.name || '')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, padding: '1rem .85rem', display: 'flex', flexDirection: 'column' }}>
              {renderNav(() => setDrawerOpen(false))}
            </nav>

            {/* Sign out — always visible at bottom of drawer */}
            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,.12)' }}>
              <button
                onClick={() => { handleLogout(); setDrawerOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
                  color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                }}>
                <i className="ti ti-logout" style={{ fontSize: 18 }} />
                Sign out
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
