import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { fmtMoney, fmtDate, fixedDueLabel, nextDueDate, paidThisCycle, cycleBalance, daysToNext, leaseStatus } from '../utils/helpers'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [props, setProps]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    api.get('/api/properties')
      .then(r => setProps(r.data.properties || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />
  if (error)   return <ErrState msg={error} />

  const safe = (p) => {
    if (!p?.start_date || !p?.yearly_rent) return 'unknown'
    try { return leaseStatus(p.payments || [], p.start_date, p.yearly_rent) } catch { return 'unknown' }
  }

  const total     = props.length
  const paid      = props.filter(p => safe(p) === 'paid').length
  const needsAttn = props.filter(p => !['paid','unknown'].includes(safe(p))).length
  const totalCol  = props.reduce((s, p) => s + (p.payments || []).reduce((a, x) => a + parseFloat(x.amount || 0), 0), 0)

  const urgent = props
    .filter(p => p.start_date && ['overdue','warn'].includes(safe(p)))
    .sort((a, b) => daysToNext(a.start_date) - daysToNext(b.start_date))

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
          Good {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3, fontWeight: 600 }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard label="Properties"  value={total}              icon="ti-building-estate" color="var(--navy)" />
        <StatCard label="Fully paid"  value={paid}               icon="ti-circle-check"    color="var(--green)" />
        <StatCard label="Needs action" value={needsAttn}         icon="ti-bell"            color="var(--amber)" />
        <StatCard label="Collected"   value={fmtMoney(totalCol)} icon="ti-cash"            color="var(--navy)" small />
      </div>

      {/* Urgent reminders */}
      {urgent.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>⚡ Needs Attention</h2>
            <button className="btn btn-sm" onClick={() => navigate('/reminders')}>View all</button>
          </div>
          {urgent.slice(0, 3).map(p => {
            const d   = daysToNext(p.start_date)
            const bal = cycleBalance(p.payments || [], p.start_date, p.yearly_rent)
            const ov  = d < 0
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px', borderRadius: 'var(--radius-lg)',
                border: `1.5px solid ${ov ? '#EFBDBD' : '#FAD79E'}`,
                marginBottom: 8,
                background: ov ? 'var(--red-bg)' : 'var(--amber-bg)',
              }}>
                <i className={`ti ${ov ? 'ti-alert-circle' : 'ti-bell-ringing'}`}
                  style={{ fontSize: 20, color: ov ? 'var(--red)' : 'var(--amber)', marginTop: 1, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.tenant_name || p.address}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, fontWeight: 600 }}>
                    {ov ? `Overdue ${Math.abs(d)} days` : `Due in ${d} days`}
                    {bal > 0 && <> · <strong style={{ color: 'var(--red)' }}>{fmtMoney(bal)}</strong> outstanding</>}
                  </div>
                </div>
                <button className="btn btn-sm" onClick={() => navigate('/properties')}>View</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Properties */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Properties</h2>
        <button className="btn btn-sm btn-primary" onClick={() => navigate('/properties?add=1')}>
          <i className="ti ti-plus" style={{ fontSize: 13 }} /> Add
        </button>
      </div>

      {props.length === 0
        ? <Empty onAdd={() => navigate('/properties?add=1')} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {props.map(p => <PropCard key={p.id} p={p} onClick={() => navigate('/properties')} />)}
          </div>
      }
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function StatCard({ label, value, icon, color, small }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="lbl">{label}</span>
        <i className={`ti ${icon}`} style={{ fontSize: 16, color, flexShrink: 0 }} />
      </div>
      <div className="val" style={{ fontSize: small ? 13 : 22, wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
}

function PropCard({ p, onClick }) {
  const payments = p.payments || []
  const hasLease = !!(p.start_date && p.yearly_rent)
  const paid = hasLease ? paidThisCycle(payments, p.start_date) : 0
  const bal  = hasLease ? cycleBalance(payments, p.start_date, p.yearly_rent) : 0
  const pct  = hasLease ? Math.min(100, Math.round((paid / p.yearly_rent) * 100)) : 0

  const stMap = {
    paid:    { color: 'var(--green)', cls: 'badge-green', lbl: 'Paid' },
    overdue: { color: 'var(--red)',   cls: 'badge-red',   lbl: 'Overdue' },
    warn:    { color: 'var(--amber)', cls: 'badge-amber',  lbl: 'Due soon' },
    partial: { color: 'var(--navy-mid)', cls: 'badge-blue', lbl: 'Partial' },
    unknown: { color: 'var(--text-3)',   cls: 'badge-blue', lbl: 'No lease' },
  }
  let st = 'unknown'
  if (hasLease) { try { st = leaseStatus(payments, p.start_date, p.yearly_rent) || 'unknown' } catch {} }
  const { color, cls, lbl } = stMap[st] || stMap.unknown

  return (
    <div className="card" onClick={onClick} style={{ cursor: 'pointer', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.4, color: 'var(--text)' }}>{p.address}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1, fontWeight: 600 }}>{p.city}, {p.state}</div>
        </div>
        <span className={`badge ${cls}`}>{lbl}</span>
      </div>
      {p.tenant_name && (
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: hasLease ? 8 : 0, fontWeight: 600 }}>
          <i className="ti ti-user" style={{ fontSize: 12, marginRight: 4 }} />
          {p.tenant_name}{p.occupation ? ` · ${p.occupation}` : ''}
        </div>
      )}
      {hasLease && (
        <>
          <div className="prog" style={{ margin: '6px 0 2px' }}>
            <div className="prog-fill" style={{ width: `${pct}%`, background: color }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginBottom: 8, fontWeight: 700 }}>{pct}% paid</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: 12 }}>
            <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>Due date</span>
            <span style={{ fontWeight: 800, textAlign: 'right', color: 'var(--navy)' }}>{fixedDueLabel(p.start_date)}</span>
            <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>Yearly rent</span>
            <span style={{ fontWeight: 800, textAlign: 'right' }}>{fmtMoney(p.yearly_rent)}</span>
            <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>Paid</span>
            <span style={{ fontWeight: 800, textAlign: 'right', color: 'var(--green)' }}>{fmtMoney(paid)}</span>
            {bal > 0 && <>
              <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>Balance</span>
              <span style={{ fontWeight: 800, textAlign: 'right', color: 'var(--red)' }}>{fmtMoney(bal)}</span>
            </>}
          </div>
        </>
      )}
    </div>
  )
}

function Empty({ onAdd }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border)' }}>
      <i className="ti ti-building-estate" style={{ fontSize: 40, color: 'var(--text-3)', display: 'block', marginBottom: 12 }} />
      <p style={{ fontWeight: 800, marginBottom: 6, fontSize: 15 }}>No properties yet</p>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 18, fontWeight: 600 }}>Add your first property to get started</p>
      <button className="btn btn-primary" onClick={onAdd}><i className="ti ti-plus" style={{ fontSize: 14 }} /> Add property</button>
    </div>
  )
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <i className="ti ti-loader-2" style={{ fontSize: 28, color: 'var(--navy)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function ErrState({ msg }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 36, color: 'var(--red)', display: 'block', marginBottom: 10 }} />
      <p style={{ fontWeight: 800, marginBottom: 4 }}>Something went wrong</p>
      <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{msg}</p>
    </div>
  )
}
