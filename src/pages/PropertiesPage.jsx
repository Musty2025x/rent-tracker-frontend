import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import { fmtMoney, fmtDate, statusBadge, leaseProgress, progressColor, daysLeft, initials } from '../utils/helpers'

export default function PropertiesPage() {
  const [props, setProps]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/properties')
      .then(r => setProps(r.data.properties || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (searchParams.get('add') === '1') { setShowAdd(true); setSearchParams({}) }
  }, [searchParams, setSearchParams])

  async function deleteProp(id) {
    if (!confirm('Delete this property and all its data?')) return
    try {
      await api.delete(`/api/properties/${id}`)
      toast('Property deleted.')
      setSelected(null)
      load()
    } catch { toast('Failed to delete.', 'error') }
  }

  async function renewLease(leaseId) {
    try {
      await api.post(`/api/leases/${leaseId}/renew`)
      toast('Lease renewed successfully!')
      load()
      setSelected(null)
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to renew.', 'error')
    }
  }

  if (loading) return <Loader />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Properties</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{props.length} / 5 properties</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} disabled={props.length >= 5}>
          <i className="ti ti-plus" style={{ fontSize: 14 }} /> Add property
        </button>
      </div>

      {props.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <i className="ti ti-building-estate" style={{ fontSize: 40, color: 'var(--text-3)', display: 'block', marginBottom: 12 }} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No properties yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Click "Add property" to get started</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 12 }}>
          {props.map(p => (
            <PropCard key={p.id} p={p} onClick={() => setSelected(p)} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddPropertyModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load() }}
        />
      )}

      {selected && (
        <PropertyDetailModal
          propId={selected.id}
          onClose={() => setSelected(null)}
          onDelete={() => deleteProp(selected.id)}
          onRenew={(leaseId) => renewLease(leaseId)}
          onRefresh={() => { load() }}
          toast={toast}
        />
      )}
    </div>
  )
}

function PropCard({ p, onClick }) {
  const badge = p.end_date ? statusBadge(p.end_date) : { cls: 'badge-blue', label: 'No lease' }
  const pct   = p.start_date && p.end_date ? leaseProgress(p.start_date, p.end_date) : 0
  const color = p.end_date ? progressColor(p.end_date) : '#378ADD'

  return (
    <div className="card" onClick={onClick}
      style={{ cursor: 'pointer', borderLeft: `3px solid ${color}`, padding: '1rem 1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{p.address}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{p.city}, {p.state}, {p.country}</div>
        </div>
        <span className={`badge ${badge.cls}`} style={{ flexShrink: 0 }}>{badge.label}</span>
      </div>

      {p.tenant_name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(p.tenant_name)}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{p.tenant_name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{p.occupation}</div>
          </div>
        </div>
      )}

      <div className="prog" style={{ margin: '6px 0 4px' }}>
        <div className="prog-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
        <span>{pct}% elapsed</span>
        <span>Expires {fmtDate(p.end_date)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        <span style={{ color: 'var(--text-2)' }}>Yearly rent</span>
        <span style={{ fontWeight: 600 }}>{fmtMoney(p.yearly_rent)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
        <span style={{ color: 'var(--text-2)' }}>Total paid</span>
        <span style={{ fontWeight: 600, color: 'var(--green)' }}>{fmtMoney(p.total_paid)}</span>
      </div>
    </div>
  )
}

function PropertyDetailModal({ propId, onClose, onDelete, onRenew, onRefresh, toast }) {
  const [p, setP]           = useState(null)
  const [payments, setPayments] = useState([])
  const [tab, setTab]       = useState('details')
  const [loading, setLoading] = useState(true)
  const [payForm, setPayForm] = useState({ amount: '', paid_date: new Date().toISOString().slice(0,10), note: '' })
  const [saving, setSaving] = useState(false)
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/api/properties/${propId}`),
      api.get(`/api/payments?property_id=${propId}`)
    ]).then(([pr, payr]) => {
      setP(pr.data.property)
      setPayments(payr.data.payments || [])
    }).finally(() => setLoading(false))
  }, [propId])

  async function addPayment(e) {
    e.preventDefault()
    if (!p?.lease_id) { toast('No active lease found.', 'error'); return }
    setSaving(true)
    try {
      await api.post('/api/payments', { lease_id: p.lease_id, ...payForm, amount: parseFloat(payForm.amount) })
      toast('Payment recorded!')
      setPayForm({ amount: '', paid_date: new Date().toISOString().slice(0,10), note: '' })
      const r = await api.get(`/api/payments?property_id=${propId}`)
      setPayments(r.data.payments || [])
      onRefresh()
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save.', 'error')
    } finally { setSaving(false) }
  }

  async function deletePayment(payId) {
    if (!confirm('Delete this payment record?')) return
    try {
      await api.delete(`/api/payments/${payId}`)
      toast('Payment deleted.')
      const r = await api.get(`/api/payments?property_id=${propId}`)
      setPayments(r.data.payments || [])
      onRefresh()
    } catch { toast('Failed to delete.', 'error') }
  }

  async function loadReceipt(payId) {
    try {
      const r = await api.get(`/api/payments/${payId}/receipt`)
      setReceipt(r.data.receipt)
    } catch { toast('Could not load receipt.', 'error') }
  }

  if (loading || !p) return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ display:'flex',alignItems:'center',justifyContent:'center',height:200 }}>
        <i className="ti ti-loader-2" style={{ fontSize: 28, animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (receipt) return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <span className="modal-title"><i className="ti ti-receipt" style={{ marginRight: 6, fontSize: 16 }} />Payment receipt</span>
          <div style={{ display:'flex',gap:8 }}>
            <button className="btn btn-sm btn-primary" onClick={() => {
              const w = window.open('','_blank','width=560,height=680')
              w.document.write(`<html><head><title>Receipt ${receipt.receipt_no}</title>
              <style>body{font-family:sans-serif;padding:32px;color:#111;max-width:480px;margin:0 auto}
              h2{font-size:18px;text-align:center;margin-bottom:4px}.sub{text-align:center;font-size:12px;color:#666;margin-bottom:20px}
              .amt{font-size:28px;font-weight:700;color:#27500A;text-align:center;padding:16px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:16px 0}
              .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f5f5f5;font-size:13px}
              .lbl{color:#666}.val{font-weight:500}
              .footer{margin-top:20px;font-size:11px;color:#999;text-align:center}</style>
              </head><body>
              <h2>Rent Payment Receipt</h2>
              <div class="sub">Receipt No: ${receipt.receipt_no}</div>
              <div class="amt">₦${Number(receipt.amount).toLocaleString('en-NG')}</div>
              <div class="row"><span class="lbl">Tenant</span><span class="val">${receipt.tenant_name}</span></div>
              <div class="row"><span class="lbl">Property</span><span class="val">${receipt.address}, ${receipt.city}</span></div>
              <div class="row"><span class="lbl">State</span><span class="val">${receipt.state}, ${receipt.country}</span></div>
              <div class="row"><span class="lbl">Payment date</span><span class="val">${fmtDate(receipt.paid_date)}</span></div>
              <div class="row"><span class="lbl">Lease period</span><span class="val">${fmtDate(receipt.start_date)} — ${fmtDate(receipt.end_date)}</span></div>
              ${receipt.note ? `<div class="row"><span class="lbl">Note</span><span class="val">${receipt.note}</span></div>` : ''}
              <div class="footer">This receipt confirms rent payment. Keep for your records.</div>
              </body></html>`)
              w.document.close(); w.focus(); w.print()
            }}>
              <i className="ti ti-printer" style={{ fontSize: 13 }} /> Print
            </button>
            <button className="btn btn-sm" onClick={() => setReceipt(null)}><i className="ti ti-x" style={{ fontSize: 13 }} /></button>
          </div>
        </div>
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '1.25rem', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Receipt No: {receipt.receipt_no}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)' }}>₦{Number(receipt.amount).toLocaleString('en-NG')}</div>
        </div>
        {[['Tenant', receipt.tenant_name],['Property', `${receipt.address}, ${receipt.city}`],['State', `${receipt.state}, ${receipt.country}`],
          ['Payment date', fmtDate(receipt.paid_date)],['Lease period', `${fmtDate(receipt.start_date)} — ${fmtDate(receipt.end_date)}`],
          receipt.note && ['Note', receipt.note]].filter(Boolean).map(([l,v]) => (
          <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:13 }}>
            <span style={{ color:'var(--text-2)' }}>{l}</span><span style={{ fontWeight:500 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const badge = p.end_date ? statusBadge(p.end_date) : { cls: 'badge-blue', label: 'No lease' }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div className="avatar">{initials(p.tenant_name || '')}</div>
            <div>
              <div className="modal-title">{p.tenant_name || p.address}</div>
              <div style={{ fontSize:11,color:'var(--text-3)' }}>{p.occupation}</div>
            </div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span className={`badge ${badge.cls}`}>{badge.label}</span>
            <button className="btn btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize:16 }} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex',gap:4,borderBottom:'1px solid var(--border)',marginBottom:16 }}>
          {['details','payments','notes'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'6px 12px',fontSize:12,fontWeight:500,border:'none',background:'none',cursor:'pointer',
                borderBottom: tab===t ? '2px solid var(--blue)' : '2px solid transparent',
                color: tab===t ? 'var(--blue)' : 'var(--text-2)', marginBottom:'-1px' }}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'details' && (
          <div>
            <div className="grid-2" style={{ gap:12 }}>
              <InfoSection title="Tenant">
                <InfoRow label="Name" value={p.tenant_name} />
                <InfoRow label="Occupation" value={p.occupation} />
                <InfoRow label="Phone" value={p.tenant_phone} />
                <InfoRow label="Email" value={p.tenant_email} />
              </InfoSection>
              <InfoSection title="Property">
                <InfoRow label="Address" value={p.address} />
                <InfoRow label="City" value={p.city} />
                <InfoRow label="State" value={p.state} />
                <InfoRow label="Country" value={p.country} />
              </InfoSection>
              <InfoSection title="Lease">
                <InfoRow label="Move-in" value={fmtDate(p.move_in_date)} />
                <InfoRow label="Start" value={fmtDate(p.start_date)} />
                <InfoRow label="End" value={fmtDate(p.end_date)} />
                <InfoRow label="Duration" value={`${p.duration_months} months`} />
              </InfoSection>
              <InfoSection title="Financials">
                <InfoRow label="Yearly rent" value={fmtMoney(p.yearly_rent)} />
                <InfoRow label="Monthly equiv." value={fmtMoney(p.yearly_rent / 12)} />
                <InfoRow label="Total paid" value={fmtMoney(p.total_paid)} valueColor="var(--green)" />
              </InfoSection>
            </div>
            <div style={{ display:'flex',gap:8,marginTop:16,flexWrap:'wrap' }}>
              {p.lease_id && (
                <button className="btn btn-sm btn-primary" onClick={() => onRenew(p.lease_id)}>
                  <i className="ti ti-refresh" style={{ fontSize:13 }} /> Renew lease
                </button>
              )}
              <button className="btn btn-sm btn-danger" onClick={onDelete}>
                <i className="ti ti-trash" style={{ fontSize:13 }} /> Delete property
              </button>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div>
            <form onSubmit={addPayment} style={{ background:'var(--bg)',borderRadius:'var(--radius)',padding:'1rem',marginBottom:16 }}>
              <div style={{ fontSize:11,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:10 }}>Record new payment</div>
              <div className="grid-2" style={{ marginBottom:10 }}>
                <div className="field"><label>Amount (₦)</label>
                  <input type="number" value={payForm.amount} onChange={e => setPayForm(f=>({...f,amount:e.target.value}))} placeholder={p.yearly_rent} required /></div>
                <div className="field"><label>Date</label>
                  <input type="date" value={payForm.paid_date} onChange={e => setPayForm(f=>({...f,paid_date:e.target.value}))} required /></div>
              </div>
              <div className="field" style={{ marginBottom:10 }}><label>Note (optional)</label>
                <input value={payForm.note} onChange={e => setPayForm(f=>({...f,note:e.target.value}))} placeholder="e.g. Renewal 2026" /></div>
              <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                <i className="ti ti-plus" style={{ fontSize:13 }} /> {saving ? 'Saving…' : 'Add payment'}
              </button>
            </form>

            {payments.length === 0 ? (
              <p style={{ fontSize:13,color:'var(--text-3)',textAlign:'center',padding:'1.5rem' }}>No payments recorded yet.</p>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table className="tbl">
                  <thead><tr><th>Date</th><th>Amount</th><th>Note</th><th>Receipt</th><th></th></tr></thead>
                  <tbody>
                    {payments.map(pay => (
                      <tr key={pay.id}>
                        <td>{fmtDate(pay.paid_date)}</td>
                        <td style={{ color:'var(--green)',fontWeight:600 }}>₦{Number(pay.amount).toLocaleString('en-NG')}</td>
                        <td style={{ color:'var(--text-2)' }}>{pay.note || '—'}</td>
                        <td><button className="btn btn-sm" onClick={() => loadReceipt(pay.id)}><i className="ti ti-receipt" style={{ fontSize:12 }} /> View</button></td>
                        <td><button className="btn btn-sm btn-danger" onClick={() => deletePayment(pay.id)}><i className="ti ti-trash" style={{ fontSize:12 }} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div>
            <p style={{ fontSize:13,color:'var(--text-2)',lineHeight:1.7,minHeight:60 }}>
              {p.notes || <span style={{ color:'var(--text-3)' }}>No notes for this property.</span>}
            </p>
            <NotesEditor propId={p.id} current={p.notes} toast={toast} onSaved={notes => setP(prev => ({...prev, notes}))} />
          </div>
        )}
      </div>
    </div>
  )
}

function NotesEditor({ propId, current, toast, onSaved }) {
  const [notes, setNotes] = useState(current || '')
  const [saving, setSaving] = useState(false)
  async function save() {
    setSaving(true)
    try {
      await api.put(`/api/properties/${propId}`, { notes })
      toast('Notes saved.')
      onSaved(notes)
    } catch { toast('Failed to save.', 'error') }
    finally { setSaving(false) }
  }
  return (
    <div style={{ marginTop:12 }}>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width:'100%',minHeight:100,padding:'8px 10px',fontSize:13,borderRadius:'var(--radius)',border:'1px solid var(--border-md)',background:'var(--surface)',color:'var(--text)',resize:'vertical',fontFamily:'var(--font)' }} placeholder="Add notes about this property or tenant..." />
      <button className="btn btn-sm btn-primary" style={{ marginTop:8 }} onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save notes'}
      </button>
    </div>
  )
}

function InfoSection({ title, children }) {
  return (
    <div style={{ background:'var(--bg)',borderRadius:'var(--radius)',padding:'.85rem' }}>
      <div style={{ fontSize:10,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8 }}>{title}</div>
      {children}
    </div>
  )
}
function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--border)',fontSize:12 }}>
      <span style={{ color:'var(--text-2)' }}>{label}</span>
      <span style={{ fontWeight:500,color:valueColor||'var(--text)',textAlign:'right',maxWidth:'55%' }}>{value||'—'}</span>
    </div>
  )
}

function AddPropertyModal({ onClose, onSaved }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm] = useState({
    address:'', city:'', state:'', country:'Nigeria',
    tenant_name:'', occupation:'', phone:'', email:'', notes:'',
    move_in_date:'', start_date:'', yearly_rent:'', duration_months:'12'
  })
  function set(k,v) { setForm(f=>({...f,[k]:v})); setError('') }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/properties', { ...form, yearly_rent: parseFloat(form.yearly_rent), duration_months: parseInt(form.duration_months) })
      toast('Property added!')
      onSaved()
    } catch(err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save.')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth:560 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add property</span>
          <button className="btn btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize:16 }} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="section-title" style={{ marginTop:0 }}>Property location</div>
          <div className="grid-2">
            <div className="field"><label>Address *</label><input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="12 Bode Thomas St, VI" required /></div>
            <div className="field"><label>City *</label><input value={form.city} onChange={e=>set('city',e.target.value)} placeholder="Lagos" required /></div>
            <div className="field"><label>State *</label><input value={form.state} onChange={e=>set('state',e.target.value)} placeholder="Lagos State" required /></div>
            <div className="field"><label>Country</label><input value={form.country} onChange={e=>set('country',e.target.value)} /></div>
          </div>
          <div className="section-title">Tenant details</div>
          <div className="grid-2">
            <div className="field"><label>Full name *</label><input value={form.tenant_name} onChange={e=>set('tenant_name',e.target.value)} placeholder="Oluwaseun Adeyemi" required /></div>
            <div className="field"><label>Occupation</label><input value={form.occupation} onChange={e=>set('occupation',e.target.value)} placeholder="Accountant" /></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+234 803 000 0000" /></div>
            <div className="field"><label>Email</label><input value={form.email} onChange={e=>set('email',e.target.value)} placeholder="tenant@email.com" /></div>
          </div>
          <div className="section-title">Lease & payment</div>
          <div className="grid-2">
            <div className="field"><label>Move-in date *</label><input type="date" value={form.move_in_date} onChange={e=>set('move_in_date',e.target.value)} required /></div>
            <div className="field"><label>Rent start date *</label><input type="date" value={form.start_date} onChange={e=>set('start_date',e.target.value)} required /></div>
            <div className="field"><label>Yearly rent (₦) *</label><input type="number" value={form.yearly_rent} onChange={e=>set('yearly_rent',e.target.value)} placeholder="900000" required /></div>
            <div className="field"><label>Duration</label>
              <select value={form.duration_months} onChange={e=>set('duration_months',e.target.value)}>
                <option value="6">6 months</option>
                <option value="12">1 year</option>
                <option value="24">2 years</option>
              </select>
            </div>
          </div>
          <div className="field" style={{ marginTop:10 }}><label>Notes</label><textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="e.g. Parking slot A1 allocated. No pets." /></div>
          {error && <p className="error-msg">{error}</p>}
          <div style={{ display:'flex',gap:8,justifyContent:'flex-end',marginTop:16 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : <><i className="ti ti-check" style={{ fontSize:14 }} /> Save property</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Loader() {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'60vh' }}>
      <i className="ti ti-loader-2" style={{ fontSize:28,color:'var(--text-3)',animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
