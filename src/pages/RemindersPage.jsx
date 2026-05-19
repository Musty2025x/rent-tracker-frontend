import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { fmtDate, fmtMoney, daysLeft } from '../utils/helpers'
import { useToast } from '../context/ToastContext'

export default function RemindersPage() {
  const [props, setProps]   = useState([])
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
    try {
      await api.post(`/api/leases/${leaseId}/renew`)
      toast('Lease renewed!')
      load()
    } catch(err) {
      toast(err.response?.data?.error || 'Failed to renew.', 'error')
    }
  }

  const urgent  = props.filter(p => p.end_date && daysLeft(p.end_date) <= 60 && daysLeft(p.end_date) >= 0)
  const expired = props.filter(p => p.end_date && daysLeft(p.end_date) < 0)
  const healthy = props.filter(p => p.end_date && daysLeft(p.end_date) > 60)

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'60vh' }}>
      <i className="ti ti-loader-2" style={{ fontSize:28,color:'var(--text-3)',animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:20,fontWeight:600 }}>Reminders</h1>
        <p style={{ fontSize:13,color:'var(--text-2)',marginTop:2 }}>Lease expiry status across all your properties</p>
      </div>

      <div className="grid-3" style={{ marginBottom:'1.75rem' }}>
        <div className="stat-card" style={{ borderTop:`3px solid var(--red)` }}><div className="lbl">Expired</div><div className="val" style={{ color:'var(--red)' }}>{expired.length}</div></div>
        <div className="stat-card" style={{ borderTop:`3px solid #EF9F27` }}><div className="lbl">Expiring within 60 days</div><div className="val" style={{ color:'var(--amber)' }}>{urgent.length}</div></div>
        <div className="stat-card" style={{ borderTop:`3px solid var(--green)` }}><div className="lbl">Healthy leases</div><div className="val" style={{ color:'var(--green)' }}>{healthy.length}</div></div>
      </div>

      {expired.length === 0 && urgent.length === 0 ? (
        <div style={{ textAlign:'center',padding:'3rem',background:'var(--surface)',borderRadius:'var(--radius-lg)',border:'1px solid var(--border)' }}>
          <i className="ti ti-circle-check" style={{ fontSize:40,color:'var(--green)',display:'block',marginBottom:12 }} />
          <p style={{ fontWeight:600,marginBottom:4 }}>All leases in good standing</p>
          <p style={{ fontSize:13,color:'var(--text-2)' }}>No reminders right now. You'll be notified when leases approach expiry.</p>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {[...expired, ...urgent].sort((a,b) => daysLeft(a.end_date) - daysLeft(b.end_date)).map(p => {
            const d      = daysLeft(p.end_date)
            const isExp  = d < 0
            const bg     = isExp ? 'var(--red-bg)'   : 'var(--amber-bg)'
            const border = isExp ? '#F7C1C1'          : '#FAC775'
            const icon   = isExp ? 'ti-alert-circle' : 'ti-bell-ringing'
            const color  = isExp ? 'var(--red)'      : 'var(--amber)'
            const msg    = isExp ? `Rent expired ${Math.abs(d)} day${Math.abs(d)!==1?'s':''} ago` : `Expiring in ${d} day${d!==1?'s':''}`

            return (
              <div key={p.id} style={{ background:bg,border:`1px solid ${border}`,borderRadius:'var(--radius-lg)',padding:'1rem 1.25rem' }}>
                <div style={{ display:'flex',alignItems:'flex-start',gap:12 }}>
                  <i className={`ti ${icon}`} style={{ fontSize:22,color,flexShrink:0,marginTop:2 }} />
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:600,fontSize:14,marginBottom:2 }}>{p.tenant_name}</div>
                    <div style={{ fontSize:12,color:'var(--text-2)',marginBottom:6 }}>{p.address}, {p.city}, {p.state}</div>
                    <div style={{ display:'flex',flexWrap:'wrap',gap:'6px 16px',fontSize:12,marginBottom:10 }}>
                      <span><span style={{ color:'var(--text-3)' }}>Status:</span> <strong style={{ color }}>{msg}</strong></span>
                      <span><span style={{ color:'var(--text-3)' }}>Expiry:</span> {fmtDate(p.end_date)}</span>
                      <span><span style={{ color:'var(--text-3)' }}>Rent:</span> {fmtMoney(p.yearly_rent)}/yr</span>
                      {p.tenant_phone && <span><i className="ti ti-phone" style={{ fontSize:11,marginRight:3 }} />{p.tenant_phone}</span>}
                      {p.tenant_email && <span><i className="ti ti-mail" style={{ fontSize:11,marginRight:3 }} />{p.tenant_email}</span>}
                    </div>
                    <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                      {p.lease_id && (
                        <button className="btn btn-sm btn-primary" onClick={() => renew(p.lease_id)}>
                          <i className="ti ti-refresh" style={{ fontSize:12 }} /> Renew lease
                        </button>
                      )}
                      <button className="btn btn-sm" onClick={() => navigate('/properties')}>
                        <i className="ti ti-eye" style={{ fontSize:12 }} /> View property
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {healthy.length > 0 && (
        <div style={{ marginTop:'1.5rem' }}>
          <div style={{ fontSize:11,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8 }}>Healthy leases</div>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            {healthy.map(p => {
              const d = daysLeft(p.end_date)
              return (
                <div key={p.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius)',fontSize:13 }}>
                  <i className="ti ti-circle-check" style={{ fontSize:16,color:'var(--green)',flexShrink:0 }} />
                  <div style={{ flex:1,minWidth:0 }}>
                    <span style={{ fontWeight:500 }}>{p.tenant_name}</span>
                    <span style={{ color:'var(--text-3)',margin:'0 8px' }}>·</span>
                    <span style={{ color:'var(--text-2)' }}>{p.address}</span>
                  </div>
                  <span className="badge badge-green">{d}d left</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
