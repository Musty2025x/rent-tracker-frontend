import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/helpers'

const NAV = [
  { to: '/',            icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { to: '/properties',  icon: 'ti-building-estate',  label: 'Properties' },
  { to: '/payments',    icon: 'ti-cash',             label: 'Payments' },
  { to: '/reminders',   icon: 'ti-bell',             label: 'Reminders' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const pageTitle = NAV.find(n => n.to === location.pathname)?.label || 'Rent Tracker'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside style={{
        width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
      }} className="desktop-sidebar">
        {/* Brand */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-building" style={{ fontSize: 17, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Rent Tracker</span>
          </div>
        </div>
        {/* Nav links */}
        <nav style={{ flex: 1, padding: '1rem .75rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 'var(--radius)',
                fontSize: 13, fontWeight: 500,
                color: isActive ? 'var(--blue)' : 'var(--text-2)',
                background: isActive ? 'var(--blue-bg)' : 'transparent',
                textDecoration: 'none', transition: 'all .15s',
              })}>
              <i className={`ti ${icon}`} style={{ fontSize: 17 }} />
              {label}
            </NavLink>
          ))}
        </nav>
        {/* User */}
        <div style={{ padding: '.75rem 1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
            <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials(user?.name || '')}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', color: 'var(--text-2)' }}>
            <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200 }} />
      )}

      {/* ── Mobile drawer ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 260,
        background: 'var(--surface)', zIndex: 201,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .25s ease',
        display: 'flex', flexDirection: 'column',
        boxShadow: drawerOpen ? '4px 0 20px rgba(0,0,0,.12)' : 'none',
      }} className="mobile-drawer">
        {/* Drawer header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-building" style={{ fontSize: 16, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Rent Tracker</span>
          </div>
          <button onClick={() => setDrawerOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-2)' }}>
            <i className="ti ti-x" style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Drawer nav */}
        <nav style={{ flex: 1, padding: '1rem .75rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              onClick={() => setDrawerOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 'var(--radius)',
                fontSize: 14, fontWeight: 500,
                color: isActive ? 'var(--blue)' : 'var(--text-2)',
                background: isActive ? 'var(--blue-bg)' : 'transparent',
                textDecoration: 'none',
              })}>
              <i className={`ti ${icon}`} style={{ fontSize: 20 }} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Drawer user + logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{initials(user?.name || '')}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', color: 'var(--text-2)' }}>
            <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign out
          </button>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>

        {/* Mobile top bar */}
        <header className="mobile-header" style={{
          display: 'none', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1rem', height: 52,
          background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <button onClick={() => setDrawerOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text)' }}>
            <i className="ti ti-menu-2" style={{ fontSize: 22 }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-building" style={{ fontSize: 13, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{pageTitle}</span>
          </div>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(user?.name || '')}</div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }} className="main-content">
          <Outlet />
        </main>

        {/* ── Mobile bottom nav ── */}
        <nav className="mobile-bottom-nav" style={{
          display: 'none', position: 'sticky', bottom: 0,
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
          padding: '6px 0 max(6px, env(safe-area-inset-bottom))',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {NAV.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '4px 0', textDecoration: 'none',
                  color: isActive ? 'var(--blue)' : 'var(--text-3)',
                })}>
                {({ isActive }) => (
                  <>
                    <div style={{
                      width: 36, height: 28, borderRadius: 14,
                      background: isActive ? 'var(--blue-bg)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background .15s',
                    }}>
                      <i className={`ti ${icon}`} style={{ fontSize: 20 }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* ── Responsive CSS ── */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-header   { display: flex !important; }
          .mobile-bottom-nav { display: block !important; }
          .main-content { padding: 1rem !important; }
        }
        @media (min-width: 769px) {
          .mobile-drawer { display: none !important; }
        }
      `}</style>
    </div>
  )
}
