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

  // Shared nav link renderer
  const renderNav = (closeDrawer) => NAV.map(({ to, icon, label }) => (
    <NavLink
      key={to} to={to} end={to === '/'}
      onClick={closeDrawer || undefined}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 10, margin: '1px 0',
        fontSize: 14, fontWeight: 600, textDecoration: 'none',
        color: isActive ? 'var(--navy)' : 'rgba(255,255,255,.8)',
        background: isActive ? '#ffffff' : 'transparent',
      })}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 18, flexShrink: 0 }} />
      {label}
    </NavLink>
  ))

  const renderUserBlock = (dark) => (
    <div style={{ padding: '12px 14px', borderTop: `1px solid ${dark ? 'rgba(255,255,255,.12)' : 'var(--border)'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: dark ? 'rgba(255,255,255,.18)' : 'var(--navy-bg)',
          color: dark ? '#fff' : 'var(--navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
        }}>{initials(user?.name || '')}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: dark ? '#fff' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
          <div style={{ fontSize: 10, color: dark ? 'rgba(255,255,255,.5)' : 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
        </div>
      </div>
      <button
        onClick={handleLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%',
          padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
          border: `1px solid ${dark ? 'rgba(255,255,255,.22)' : 'var(--border-md)'}`,
          background: 'transparent',
          color: dark ? 'rgba(255,255,255,.82)' : 'var(--text-2)',
          fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
        }}
      >
        <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign out
      </button>
    </div>
  )

  /* ─── DESKTOP layout ─────────────────────────────── */
  if (!isMobile) {
    return (
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column',
          height: '100%', overflowY: 'auto', background: 'var(--navy)',
        }}>
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
          {renderUserBlock(true)}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: 'var(--bg)', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    )
  }

  /* ─── MOBILE layout ──────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1rem', height: 56, flexShrink: 0, background: 'var(--navy)',
      }}>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ background: 'none', border: 'none', padding: '8px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <i className="ti ti-menu-2" style={{ fontSize: 24, color: '#fff' }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-building" style={{ fontSize: 14, color: 'var(--navy)' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{title}</span>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
          {initials(user?.name || '')}
        </div>
      </header>

      {/* Scrollable content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--bg)', minWidth: 0, minHeight: 0 }}>
        <Outlet />
      </main>

      {/* Bottom nav */}
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

      {/* Drawer — only rendered when open, so it can NEVER block clicks when closed */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,.6)', zIndex: 400 }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: 260,
            background: 'var(--navy)', zIndex: 401,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-building" style={{ fontSize: 16, color: 'var(--navy)' }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Rent Tracker</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'rgba(255,255,255,.7)', display: 'flex', fontFamily: 'inherit' }}>
                <i className="ti ti-x" style={{ fontSize: 22 }} />
              </button>
            </div>
            <nav style={{ flex: 1, padding: '1rem .85rem', display: 'flex', flexDirection: 'column' }}>
              {renderNav(() => setDrawerOpen(false))}
            </nav>
            {renderUserBlock(true)}
          </div>
        </>
      )}
    </div>
  )
}
