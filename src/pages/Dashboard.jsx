import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import {
  fmtMoney, fmtDate, statusBadge, statusColor,
  paidThisCycle, cycleBalance, daysToNext, fixedDueLabel,
  nextDueDate, leaseStatus, totalEverPaid,
} from '../utils/helpers'

export default function Dashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [props, setProps]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/properties')
      .then(r => setProps(r.data.properties || []))
      .finally(() => setLoading(false))
  }, [])

  const total     = props.length
  const paid      = props.filter(p => leaseStatus(p.payments, p.start_date, p.yearly_rent) === 'paid').length
  const attention = props.filter(p => leaseStatus(p.payments, p.start_date, p.yearly_rent) !== 'paid').length
  const totalCol  = props.reduce((s, p) => s + totalEverPaid(p.payments || []), 0)

  const urgent = props
    .filter(p => ['overdue', 'warn'].includes(leaseStatus(p.payments, p.start_date, p.yearly_rent)))
    .sort((a, b) => daysToNext(a.start_date) - daysToNext(b.start_date))

  if (loading) return <Loader />

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <StatCard label="Total properties"    value={total}          icon="ti-building-estate" color="var(--blue)" />
        <StatCard label="Fully paid"          value={paid}           icon="ti-circle-check"    color="var(--green)" />
        <StatCard label="Needs attention"     value={attention}      icon="ti-bell"            color="var(--amber)" />
        <StatCard label="Total collected"     value={fmtMoney(totalCol)} icon="ti-cash"        color="var(--blue)" small />
      </div>

      {/* Urgent reminders */}
      {urgent.length > 0 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Reminders</h2>
            <button className="btn btn-sm" onClick={() => navigate('/reminders')}>View all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {urgent.slice(0, 3).map(p => {
              const d    = daysToNext(p.start_date)
              const bal  = cycleBalance(p.payments || [], p.start_date, p.yearly_rent)
              const isExp = d < 0
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 'var(--radius)',
                  border: '1px solid', background: isExp ? 'var(--red-bg)' : 'var(--amber-bg)',
                  borderColor: isExp ? '#F7C1C1' : '#FAC775',
                }}>
                  <i className={`ti ${isExp ? 'ti-alert-circle' : 'ti-bell-ringing'}`}
                     style={{ fontSize: 18, color: isExp ? 'var(--red)' : 'var(--amber)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.tenant_name} — {p.address}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>
                      {isExp ? `Overdue by ${Math.abs(d)} days` : `Due in ${d} days`}
                      {' · '}Balance outstanding: <strong style={{ color: 'var(--red)' }}>{fmtMoney(bal)}</strong>
                    </div>
                  </div>
                  <button className="btn btn-sm" onClick={() => navigate('/properties')}>View</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Properties grid */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600 }}>Properties</h2>
        <button className="btn btn-sm btn-primary" onClick={() => navigate('/properties?add=1')}>
          <i className="ti ti-plus" style={{ fontSize: 13 }} /> Add property
        </button>
      </div>

      {props.length === 0 ? (
        <EmptyState onAdd={() => navigate('/properties?add=1')} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
          {props.map(p => <PropCard key={p.id} p={p} onClick={() => navigate('/properties')} />)}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color, small }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="lbl">{label}</span>
        <i className={`ti ${icon}`} style={{ fontSize: 16, color }} />
      </div>
      <div className="val" style={{ fontSize: small ? 14 : 22, paddingTop: small ? 4 : 0 }}>{value}</div>
    </div>
  )
}

function PropCard({ p, onClick }) {
  const payments = p.payments || []
  const badge    = statusBadge(payments, p.start_date, p.yearly_rent)
  const color    = statusColor(payments, p.start_date, p.yearly_rent)
  const paid     = paidThisCycle(payments, p.start_date)
  const bal      = cycleBalance(payments, p.start_date, p.yearly_rent)
  const pct      = p.yearly_rent ? Math.min(100, Math.round((paid / p.yearly_rent) * 100)) : 0
  const nd       = p.start_date ? nextDueDate(p.start_date) : null

  return (
    <div className="card" style={{ cursor: 'pointer', borderLeft: `3px solid ${color}`, padding: '1rem 1.1rem' }} onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{p.address}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{p.city}, {p.state}</div>
        </div>
        <span className={`badge ${badge.cls}`}>{badge.label}</span>
      </div>
      {p.tenant_name && (
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
          <i className="ti ti-user" style={{ fontSize: 12, marginRight: 4 }} />{p.tenant_name} · {p.occupation}
        </div>
      )}
      <div className="prog" style={{ marginBottom: 2 }}>
        <div className="prog-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right', marginBottom: 6 }}>{pct}% of annual rent paid</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
        <span style={{ color: 'var(--text-3)' }}>Move-in</span>
        <span style={{ fontWeight: 500 }}>{fmtDate(p.move_in_date)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
        <span style={{ color: 'var(--text-3)' }}>Fixed due date</span>
        <span style={{ fontWeight: 500, color: 'var(--blue)' }}>{p.start_date ? fixedDueLabel(p.start_date) : '—'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
        <span style={{ color: 'var(--text-3)' }}>Next due</span>
        <span style={{ fontWeight: 500 }}>{nd ? fmtDate(nd.toISOString().slice(0, 10)) : '—'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
        <span style={{ color: 'var(--text-3)' }}>Yearly rent</span>
        <span style={{ fontWeight: 600 }}>{fmtMoney(p.yearly_rent)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
        <span style={{ color: 'var(--text-3)' }}>Paid this cycle</span>
        <span style={{ fontWeight: 600, color: 'var(--green)' }}>{fmtMoney(paid)}</span>
      </div>
      {bal > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'var(--text-3)' }}>Balance outstanding</span>
          <span style={{ fontWeight: 600, color: 'var(--red)' }}>{fmtMoney(bal)}</span>
        </div>
      )}
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <i className="ti ti-building-estate" style={{ fontSize: 40, color: 'var(--text-3)', display: 'block', marginBottom: 12 }} />
      <p style={{ fontWeight: 600, marginBottom: 4 }}>No properties yet</p>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Add your first property to get started</p>
      <button className="btn btn-primary" onClick={onAdd}><i className="ti ti-plus" style={{ fontSize: 14 }} /> Add property</button>
    </div>
  )
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <i className="ti ti-loader-2" style={{ fontSize: 28, color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
