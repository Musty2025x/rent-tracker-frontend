import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/helpers'

const NAV = [
  { to: '/',           icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { to: '/properties', icon: 'ti-building-estate',  label: 'Properties' },
  { to: '/payments',   icon: 'ti-cash',             label: 'Payments' },
  { to: '/reminders',  icon: 'ti-bell',             label: 'Reminders' },
]

const isMobile = () => window.innerWidth <= 768

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [drawer, setDrawer] = useState(false)

  function handleLogout() { logout(); navigate('/login') }

  const pageTitle = NAV.find(n =>
    n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
  )?.label || 'Rent Tracker'

  return (
    <>
      <style>{`
        .rt-sidebar   { display: flex; }
        .rt-topbar    { display: none; }
        .rt-bottomnav { display: none; }
        .rt-main      { padding: 2rem; }

        @media (max-width: 768px) {
          .rt-sidebar   { display: none !important; }
          .rt-topbar    { display: flex !important; }
          .rt-bottomnav { display: grid !important; }
          .rt-main      { padding: 1rem 1rem 1.5rem !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

        {/* ── Desktop sidebar ── */}
        <aside className="rt-sidebar" style={{
          width: 220, background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          flexDirection: 'column', flexShrink: 0,
          position: 'sticky', top: 0, height: '100vh',
        }}>
          <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
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
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials(user?.name || '')}</div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign out
            </button>
          </div>
        </aside>

        {/* ── Main wrapper ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Mobile top bar */}
          <header className="rt-topbar" style={{
            alignItems: 'center', justifyContent: 'space-between',
            padding: '0 1rem', height: 54,
            background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            position: 'sticky', top: 0, zIndex: 100,
          }}>
            <button
              onClick={() => setDrawer(true)}
              style={{ background: 'none', border: 'none', padding: '8px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <i className="ti ti-menu-2" style={{ fontSize: 24, color: 'var(--text)' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-building" style={{ fontSize: 14, color: '#fff' }} />
              </div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{pageTitle}</span>
            </div>
            <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials(user?.name || '')}</div>
          </header>

          {/* Page content */}
          <main className="rt-main" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <Outlet />
          </main>

          {/* Mobile bottom nav */}
          <nav className="rt-bottomnav" style={{
            gridTemplateColumns: 'repeat(4,1fr)',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            position: 'sticky', bottom: 0, zIndex: 100,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}>
            {NAV.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 2, padding: '8px 4px', textDecoration: 'none',
                  color: isActive ? 'var(--blue)' : 'var(--text-3)',
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
        </div>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {drawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          {/* Backdrop */}
          <div onClick={() => setDrawer(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />

          {/* Drawer panel */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 270,
            background: 'var(--surface)',
            display: 'flex', flexDirection: 'column',
            boxShadow: '4px 0 24px rgba(0,0,0,.15)',
          }}>
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-building" style={{ fontSize: 16, color: '#fff' }} />
                </div>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Rent Tracker</span>
              </div>
              <button onClick={() => setDrawer(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <i className="ti ti-x" style={{ fontSize: 22, color: 'var(--text-2)' }} />
              </button>
            </div>

            {/* Drawer nav */}
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

            {/* Drawer user */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div className="avatar" style={{ width: 38, height: 38, fontSize: 13 }}>{initials(user?.name || '')}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                </div>
              </div>
              <button onClick={() => { handleLogout(); setDrawer(false) }}
                className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', color: 'var(--text-2)' }}>
                <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
