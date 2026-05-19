import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { fmtMoney, fmtDate, daysToNext, leaseStatus, cycleBalance, fixedDueLabel, nextDueDate } from '../utils/helpers'
import { useToast } from '../context/ToastContext'

export default function RemindersPage() {
  const [props, setProps]     = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const toast    = useToast()

  const load = () => {
    api.get('/api/properties')
      .then(r => setProps(r.data.properties || []))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function renew(leaseId) {
    try { await api.post(`/api/leases/${leaseId}/renew`); toast('Lease renewed!'); load() }
    catch (err) { toast(err.response?.data?.error || 'Failed.', 'error') }
  }

  const overdue = props.filter(p => leaseStatus(p.payments || [], p.start_date, p.yearly_rent) === 'overdue')
  const warn    = props.filter(p => leaseStatus(p.payments || [], p.start_date, p.yearly_rent) === 'warn')
  const partial = props.filter(p => leaseStatus(p.payments || [], p.start_date, p.yearly_rent) === 'partial')
  const healthy = props.filter(p => leaseStatus(p.payments || [], p.start_date, p.yearly_rent) === 'paid')

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <i className="ti ti-loader-2" style={{ fontSize: 28, color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Reminders</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
          Payment status across all properties — due dates are fixed annually
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: '1.75rem' }}>
        <div className="stat-card" style={{ borderTop: '3px solid var(--red)' }}>
          <div className="lbl">Overdue</div>
          <div className="val" style={{ color: 'var(--red)' }}>{overdue.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #EF9F27' }}>
          <div className="lbl">Due within 60 days</div>
          <div className="val" style={{ color: 'var(--amber)' }}>{warn.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--blue)' }}>
          <div className="lbl">Partial payment</div>
          <div className="val" style={{ color: 'var(--blue)' }}>{partial.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--green)' }}>
          <div className="lbl">Fully paid</div>
          <div className="val" style={{ color: 'var(--green)' }}>{healthy.length}</div>
        </div>
      </div>

      {overdue.length === 0 && warn.length === 0 && partial.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <i className="ti ti-circle-check" style={{ fontSize: 40, color: 'var(--green)', display: 'block', marginBottom: 12 }} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>All payments up to date</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>You'll be notified as due dates approach.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...overdue, ...warn, ...partial]
            .sort((a, b) => daysToNext(a.start_date) - daysToNext(b.start_date))
            .map(p => {
              const payments = p.payments || []
              const st  = leaseStatus(payments, p.start_date, p.yearly_rent)
              const d   = daysToNext(p.start_date)
              const bal = cycleBalance(payments, p.start_date, p.yearly_rent)
              const nd  = p.start_date ? nextDueDate(p.start_date) : null
              const isOver  = st === 'overdue'
              const isPart  = st === 'partial'
              const bg      = isOver ? 'var(--red-bg)'   : isPart ? 'var(--blue-bg)'   : 'var(--amber-bg)'
              const border  = isOver ? '#F7C1C1'          : isPart ? '#B5D4F4'           : '#FAC775'
              const icon    = isOver ? 'ti-alert-circle' : isPart ? 'ti-clock'          : 'ti-bell-ringing'
              const clr     = isOver ? 'var(--red)'      : isPart ? 'var(--blue)'       : 'var(--amber)'
              const msg     = isOver
                ? `Payment overdue — ${Math.abs(d)} day${Math.abs(d) !== 1 ? 's' : ''} past due date`
                : isPart
                ? `Partial payment recorded this cycle`
                : `Due in ${d} day${d !== 1 ? 's' : ''}`

              return (
                <div key={p.id} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 22, color: clr, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{p.tenant_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>{p.address}, {p.city}, {p.state}</div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12, marginBottom: 8 }}>
                        <span><span style={{ color: 'var(--text-3)' }}>Status:</span> <strong style={{ color: clr }}>{msg}</strong></span>
                        <span><span style={{ color: 'var(--text-3)' }}>Fixed due:</span> <strong>{p.start_date ? fixedDueLabel(p.start_date) : '—'}</strong></span>
                        <span><span style={{ color: 'var(--text-3)' }}>Next due:</span> {nd ? fmtDate(nd.toISOString().slice(0, 10)) : '—'}</span>
                        <span><span style={{ color: 'var(--text-3)' }}>Yearly rent:</span> {fmtMoney(p.yearly_rent)}</span>
                        <span><span style={{ color: 'var(--text-3)' }}>Outstanding:</span> <strong style={{ color: 'var(--red)' }}>{fmtMoney(bal)}</strong></span>
                      </div>

                      {(p.tenant_phone || p.tenant_email) && (
                        <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8 }}>
                          {p.tenant_phone && <span><i className="ti ti-phone" style={{ fontSize: 11, marginRight: 3 }} />{p.tenant_phone}</span>}
                          {p.tenant_phone && p.tenant_email && <span style={{ margin: '0 6px' }}>·</span>}
                          {p.tenant_email && <span><i className="ti ti-mail" style={{ fontSize: 11, marginRight: 3 }} />{p.tenant_email}</span>}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {p.lease_id && (
                          <button className="btn btn-sm btn-primary" onClick={() => renew(p.lease_id)}>
                            <i className="ti ti-refresh" style={{ fontSize: 12 }} /> Renew lease
                          </button>
                        )}
                        <button className="btn btn-sm" onClick={() => navigate('/properties')}>
                          <i className="ti ti-eye" style={{ fontSize: 12 }} /> View &amp; record payment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Healthy leases */}
      {healthy.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Fully paid</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {healthy.map(p => {
              const d = daysToNext(p.start_date)
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 16, color: 'var(--green)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{p.tenant_name}</span>
                    <span style={{ color: 'var(--text-3)', margin: '0 8px' }}>·</span>
                    <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.address}</span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <span className="badge badge-green">Paid</span>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      Next due in {d}d · {p.start_date ? fixedDueLabel(p.start_date) : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
