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
  const [mobile, setMobile] = useState(() => window.innerWidth <= 768)

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobile && drawer ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobile, drawer])

  const handleLogout = () => { logout(); navigate('/login') }

  const title = NAV.find(n =>
    n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
  )?.label ?? 'Rent Tracker'

  // Sidebar nav links — work for both desktop and mobile drawer
  const NavLinks = ({ onNav }) => NAV.map(({ to, icon, label }) => (
    <NavLink key={to} to={to} end={to === '/'} onClick={onNav}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 10,
        fontSize: 14, fontWeight: 600, textDecoration: 'none',
        color: isActive ? 'var(--navy)' : 'rgba(255,255,255,.78)',
        background: isActive ? '#ffffff' : 'transparent',
        transition: 'background .12s, color .12s',
      })}>
      <i className={`ti ${icon}`} style={{ fontSize: 18, flexShrink: 0 }} />
      {label}
    </NavLink>
  ))

  return (
    /* Outer wrapper: flex row, fills #root which is 100% height */
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Desktop sidebar ── */}
      {!mobile && (
        <aside style={{
          width: 230, flexShrink: 0,
          background: 'var(--navy)',
          display: 'flex', flexDirection: 'column',
          height: '100%', overflowY: 'auto',
        }}>
          {/* Logo */}
          <div style={{ padding: '1.4rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-building" style={{ fontSize: 18, color: 'var(--navy)' }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Rent Tracker</span>
            </div>
          </div>
          {/* Nav */}
          <nav style={{ flex: 1, padding: '1rem .85rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <NavLinks onNav={null} />
          </nav>
          {/* User */}
          <div style={{ padding: '.85rem 1.1rem', borderTop: '1px solid rgba(255,255,255,.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {initials(user?.name || '')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%',
              padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,.2)', background: 'transparent',
              color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: 600,
            }}>
              <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign out
            </button>
          </div>
        </aside>
      )}

      {/* ── Mobile drawer backdrop ── */}
      {mobile && drawer && (
        <div onClick={() => setDrawer(false)} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,22,40,.6)', zIndex: 300,
        }} />
      )}

      {/* ── Mobile slide-in drawer ── */}
      {mobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 255,
          background: 'var(--navy)', zIndex: 301,
          display: 'flex', flexDirection: 'column',
          transform: drawer ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .22s cubic-bezier(.4,0,.2,1)',
          // CRITICAL: hidden drawer must not intercept any clicks
          pointerEvents: drawer ? 'auto' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-building" style={{ fontSize: 16, color: 'var(--navy)' }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Rent Tracker</span>
            </div>
            <button onClick={() => setDrawer(false)} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,.7)', display: 'flex' }}>
              <i className="ti ti-x" style={{ fontSize: 22 }} />
            </button>
          </div>
          <nav style={{ flex: 1, padding: '1rem .85rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <NavLinks onNav={() => setDrawer(false)} />
          </nav>
          <div style={{ padding: '.85rem 1.1rem', borderTop: '1px solid rgba(255,255,255,.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {initials(user?.name || '')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </div>
            <button onClick={() => { handleLogout(); setDrawer(false) }} style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%',
              padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,.2)', background: 'transparent',
              color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: 600,
            }}>
              <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* ── Main column ──
          position:relative + z-index:1 keeps it ABOVE the off-screen hidden drawer.
          Using height:100% to inherit from root, not 100dvh which needs parent support. ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0, height: '100%', overflow: 'hidden',
        position: 'relative', zIndex: 1,
      }}>
        {/* Mobile top bar */}
        {mobile && (
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 1rem', height: 56, flexShrink: 0,
            background: 'var(--navy)',
          }}>
            <button onClick={() => setDrawer(true)} style={{
              background: 'none', border: 'none', padding: '8px 4px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}>
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
        )}

        {/* Scrollable page content */}
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: mobile ? '1rem' : '2rem',
          WebkitOverflowScrolling: 'touch',
          // Explicit min-height 0 needed for flex children to shrink properly
          minHeight: 0,
        }}>
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        {mobile && (
          <nav style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            background: 'var(--navy)', flexShrink: 0,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            borderTop: '1px solid rgba(255,255,255,.1)',
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
        )}
      </div>
    </div>
  )
}
