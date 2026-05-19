import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/helpers'

const NAV = [
  { to: '/',          icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { to: '/properties',icon: 'ti-building-estate',  label: 'Properties' },
  { to: '/payments',  icon: 'ti-cash',             label: 'Payments' },
  { to: '/reminders', icon: 'ti-bell',             label: 'Reminders' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh'
      }}>
        {/* Brand */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-building" style={{ fontSize: 17, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Rent Tracker</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem .75rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 'var(--radius)',
                fontSize: 13, fontWeight: 500,
                color: isActive ? 'var(--blue)' : 'var(--text-2)',
                background: isActive ? 'var(--blue-bg)' : 'transparent',
                textDecoration: 'none', transition: 'all .15s'
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

      {/* Main content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
