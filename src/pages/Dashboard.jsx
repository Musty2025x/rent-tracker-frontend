import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import {
  fmtMoney, fmtDate, fixedDueLabel, nextDueDate,
  paidThisCycle, cycleBalance, daysToNext, leaseStatus,
} from '../utils/helpers'

export default function Dashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
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

  const safeStatus = (p) => {
    if (!p?.start_date || !p?.yearly_rent) return 'unknown'
    try { return leaseStatus(p.payments || [], p.start_date, p.yearly_rent) }
    catch { return 'unknown' }
  }

  const total     = props.length
  const paid      = props.filter(p => safeStatus(p) === 'paid').length
  const needsAttn = props.filter(p => !['paid','unknown'].includes(safeStatus(p))).length
  const totalCol  = props.reduce((s, p) =>
    s + (p.payments || []).reduce((a, x) => a + parseFloat(x.amount || 0), 0), 0)

  const urgent = props
    .filter(p => p.start_date && ['overdue','warn'].includes(safeStatus(p)))
    .sort((a, b) => daysToNext(a.start_date) - daysToNext(b.start_date))

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>
          Good morning, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Stats — 2 cols on mobile, 4 on desktop */}
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        <StatCard label="Properties"  value={total}              icon="ti-building-estate" color="var(--blue)" />
        <StatCard label="Fully paid"  value={paid}               icon="ti-circle-check"    color="var(--green)" />
        <StatCard label="Needs action" value={needsAttn}         icon="ti-bell"            color="var(--amber)" />
        <StatCard label="Collected"   value={fmtMoney(totalCol)} icon="ti-cash"            color="var(--blue)" small />
      </div>

      {/* Reminders */}
      {urgent.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.6rem' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Reminders</h2>
            <button className="btn btn-sm" onClick={() => navigate('/reminders')}>View all</button>
          </div>
          {urgent.slice(0, 3).map(p => {
            const d   = daysToNext(p.start_date)
            const bal = cycleBalance(p.payments || [], p.start_date, p.yearly_rent)
            const isExp = d < 0
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--radius)',
                border: '1px solid', marginBottom: 8,
                background: isExp ? 'var(--red-bg)' : 'var(--amber-bg)',
                borderColor: isExp ? '#F7C1C1' : '#FAC775',
              }}>
                <i className={`ti ${isExp ? 'ti-alert-circle' : 'ti-bell-ringing'}`}
                   style={{ fontSize: 18, color: isExp ? 'var(--red)' : 'var(--amber)', marginTop: 1, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.tenant_name || p.address}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>
                    {isExp ? `Overdue ${Math.abs(d)}d` : `Due in ${d}d`}
                    {bal > 0 && <> · <strong style={{ color: 'var(--red)' }}>{fmtMoney(bal)}</strong> outstanding</>}
                  </div>
                </div>
                <button className="btn btn-sm" style={{ flexShrink: 0 }} onClick={() => navigate('/properties')}>View</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Properties list */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.6rem' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600 }}>Properties</h2>
        <button className="btn btn-sm btn-primary" onClick={() => navigate('/properties?add=1')}>
          <i className="ti ti-plus" style={{ fontSize: 13 }} /> Add
        </button>
      </div>

      {props.length === 0
        ? <EmptyState onAdd={() => navigate('/properties?add=1')} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {props.map(p => <PropCard key={p.id} p={p} onClick={() => navigate('/properties')} />)}
          </div>
      }
    </div>
  )
}

function StatCard({ label, value, icon, color, small }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="lbl" style={{ fontSize: 10, lineHeight: 1.3 }}>{label}</span>
        <i className={`ti ${icon}`} style={{ fontSize: 15, color, flexShrink: 0 }} />
      </div>
      <div className="val" style={{ fontSize: small ? 12 : 20, wordBreak: 'break-all' }}>{value}</div>
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
    paid:    { color: '#639922', cls: 'badge-green', lbl: 'Paid' },
    overdue: { color: '#E24B4A', cls: 'badge-red',   lbl: 'Overdue' },
    warn:    { color: '#EF9F27', cls: 'badge-amber',  lbl: 'Due soon' },
    partial: { color: '#378ADD', cls: 'badge-blue',  lbl: 'Partial' },
    unknown: { color: '#9C9A94', cls: 'badge-blue',  lbl: 'No lease' },
  }
  let st = 'unknown'
  if (hasLease) { try { st = leaseStatus(payments, p.start_date, p.yearly_rent) || 'unknown' } catch {} }
  const { color, cls, lbl } = stMap[st] || stMap.unknown

  return (
    <div className="card" onClick={onClick}
      style={{ cursor: 'pointer', borderLeft: `3px solid ${color}`, padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{p.address}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{p.city}, {p.state}</div>
        </div>
        <span className={`badge ${cls}`}>{lbl}</span>
      </div>

      {p.tenant_name && (
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: hasLease ? 8 : 0 }}>
          <i className="ti ti-user" style={{ fontSize: 12, marginRight: 4 }} />
          {p.tenant_name}{p.occupation ? ` · ${p.occupation}` : ''}
        </div>
      )}

      {hasLease && (
        <>
          <div className="prog" style={{ margin: '6px 0 2px' }}>
            <div className="prog-fill" style={{ width: `${pct}%`, background: color }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right', marginBottom: 8 }}>
            {pct}% paid
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px', fontSize: 12 }}>
            {p.move_in_date && <>
              <span style={{ color: 'var(--text-3)' }}>Move-in</span>
              <span style={{ fontWeight: 500, textAlign: 'right' }}>{fmtDate(p.move_in_date)}</span>
            </>}
            <span style={{ color: 'var(--text-3)' }}>Due date</span>
            <span style={{ fontWeight: 500, textAlign: 'right', color: 'var(--blue)' }}>{fixedDueLabel(p.start_date)}</span>
            <span style={{ color: 'var(--text-3)' }}>Yearly rent</span>
            <span style={{ fontWeight: 600, textAlign: 'right' }}>{fmtMoney(p.yearly_rent)}</span>
            <span style={{ color: 'var(--text-3)' }}>Paid</span>
            <span style={{ fontWeight: 600, textAlign: 'right', color: 'var(--green)' }}>{fmtMoney(paid)}</span>
            {bal > 0 && <>
              <span style={{ color: 'var(--text-3)' }}>Balance</span>
              <span style={{ fontWeight: 600, textAlign: 'right', color: 'var(--red)' }}>{fmtMoney(bal)}</span>
            </>}
          </div>
        </>
      )}
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
      <i className="ti ti-building-estate" style={{ fontSize: 36, color: 'var(--text-3)', display: 'block', marginBottom: 10 }} />
      <p style={{ fontWeight: 600, marginBottom: 4 }}>No properties yet</p>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Add your first property to get started</p>
      <button className="btn btn-primary" onClick={onAdd}>
        <i className="ti ti-plus" style={{ fontSize: 14 }} /> Add property
      </button>
    </div>
  )
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <i className="ti ti-loader-2" style={{ fontSize: 28, color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function ErrState({ msg }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 36, color: 'var(--red)', display: 'block', marginBottom: 10 }} />
      <p style={{ fontWeight: 600, marginBottom: 4 }}>Something went wrong</p>
      <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{msg}</p>
    </div>
  )
}
