import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import {
  fmtMoney, fmtDate, statusBadge, statusColor,
  paidThisCycle, cycleBalance, daysToNext, fixedDueLabel,
  nextDueDate, leaseStatus, totalEverPaid, buildCycleHistory, initials,
} from '../utils/helpers'

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
    if (!confirm('Delete this property and all its records?')) return
    try { await api.delete(`/api/properties/${id}`); toast('Property deleted.'); setSelected(null); load() }
    catch { toast('Failed to delete.', 'error') }
  }

  async function renewLease(leaseId) {
    try { await api.post(`/api/leases/${leaseId}/renew`); toast('Lease renewed!'); load(); setSelected(null) }
    catch (err) { toast(err.response?.data?.error || 'Failed to renew.', 'error') }
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
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 12 }}>
          {props.map(p => <PropCard key={p.id} p={p} onClick={() => setSelected(p)} />)}
        </div>
      )}

      {showAdd && (
        <AddPropertyModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />
      )}

      {selected && (
        <PropertyDetailModal
          propId={selected.id}
          onClose={() => setSelected(null)}
          onDelete={() => deleteProp(selected.id)}
          onRenew={renewLease}
          onRefresh={load}
          toast={toast}
        />
      )}
    </div>
  )
}

// ─── Property card ─────────────────────────────────────────────────────────────
function PropCard({ p, onClick }) {
  const payments = p.payments || []
  const badge    = statusBadge(payments, p.start_date, p.yearly_rent)
  const color    = statusColor(payments, p.start_date, p.yearly_rent)
  const paid     = paidThisCycle(payments, p.start_date)
  const bal      = cycleBalance(payments, p.start_date, p.yearly_rent)
  const pct      = p.yearly_rent ? Math.min(100, Math.round((paid / p.yearly_rent) * 100)) : 0
  const nd       = p.start_date ? nextDueDate(p.start_date) : null

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

      <div className="prog" style={{ margin: '4px 0 2px' }}>
        <div className="prog-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right', marginBottom: 6 }}>{pct}% of annual rent paid</div>

      <Row label="Move-in date"     value={fmtDate(p.move_in_date)} />
      <Row label="Fixed annual due" value={p.start_date ? fixedDueLabel(p.start_date) : '—'} valueColor="var(--blue)" />
      <Row label="Next due date"    value={nd ? fmtDate(nd.toISOString().slice(0, 10)) : '—'} />
      <Row label="Yearly rent"      value={fmtMoney(p.yearly_rent)} />
      <Row label="Paid this cycle"  value={fmtMoney(paid)} valueColor="var(--green)" />
      {bal > 0 && <Row label="Balance outstanding" value={fmtMoney(bal)} valueColor="var(--red)" />}
    </div>
  )
}

function Row({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 4 }}>
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: valueColor || 'var(--text)' }}>{value}</span>
    </div>
  )
}

// ─── Detail modal ──────────────────────────────────────────────────────────────
function PropertyDetailModal({ propId, onClose, onDelete, onRenew, onRefresh, toast }) {
  const [p, setP]             = useState(null)
  const [payments, setPayments] = useState([])
  const [tab, setTab]         = useState('details')
  const [loading, setLoading] = useState(true)
  const [payForm, setPayForm] = useState({ amount: '', paid_date: new Date().toISOString().slice(0, 10), note: '' })
  const [saving, setSaving]   = useState(false)

  const reload = useCallback(() => {
    Promise.all([
      api.get(`/api/properties/${propId}`),
      api.get(`/api/payments?property_id=${propId}`),
    ]).then(([pr, payr]) => {
      setP(pr.data.property)
      setPayments(payr.data.payments || [])
    }).finally(() => setLoading(false))
  }, [propId])

  useEffect(() => { reload() }, [reload])

  async function addPayment(e) {
    e.preventDefault()
    if (!p?.lease_id) { toast('No active lease found.', 'error'); return }
    setSaving(true)
    try {
      await api.post('/api/payments', {
        lease_id: p.lease_id,
        amount: parseFloat(payForm.amount),
        paid_date: payForm.paid_date,
        note: payForm.note,
      })
      toast('Payment recorded!')
      setPayForm({ amount: '', paid_date: new Date().toISOString().slice(0, 10), note: '' })
      reload(); onRefresh()
    } catch (err) { toast(err.response?.data?.error || 'Failed.', 'error') }
    finally { setSaving(false) }
  }

  async function deletePayment(payId) {
    if (!confirm('Delete this payment record?')) return
    try { await api.delete(`/api/payments/${payId}`); toast('Deleted.'); reload(); onRefresh() }
    catch { toast('Failed.', 'error') }
  }

  async function showReceipt(payId) {
    try {
      const r = await api.get(`/api/payments/${payId}/receipt`)
      const rc = r.data.receipt
      const w = window.open('', '_blank', 'width=560,height=680')
      w.document.write(`<html><head><title>Receipt ${rc.receipt_no}</title>
      <style>body{font-family:sans-serif;padding:30px;max-width:480px;margin:0 auto;color:#111}
      h2{text-align:center;font-size:17px;margin-bottom:2px}.sub{text-align:center;font-size:12px;color:#666;margin-bottom:16px}
      .amt{font-size:26px;font-weight:700;color:#27500A;text-align:center;padding:14px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:14px 0}
      .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f5f5f5;font-size:13px}
      .lbl{color:#666}.val{font-weight:500}.ft{text-align:center;font-size:11px;color:#aaa;margin-top:16px}
      </style></head><body>
      <h2>Rent Payment Receipt</h2><div class="sub">${rc.receipt_no}</div>
      <div class="amt">₦${parseFloat(rc.amount).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
      <div class="row"><span class="lbl">Tenant</span><span class="val">${rc.tenant_name}</span></div>
      <div class="row"><span class="lbl">Occupation</span><span class="val">${rc.occupation||'—'}</span></div>
      <div class="row"><span class="lbl">Property</span><span class="val">${rc.address}, ${rc.city}</span></div>
      <div class="row"><span class="lbl">State / Country</span><span class="val">${rc.state}, ${rc.country}</span></div>
      <div class="row"><span class="lbl">Payment date</span><span class="val">${new Date(rc.paid_date+'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span></div>
      <div class="row"><span class="lbl">Annual due date</span><span class="val">${new Date(rc.start_date+'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short'})} every year</span></div>
      ${rc.note ? `<div class="row"><span class="lbl">Note</span><span class="val">${rc.note}</span></div>` : ''}
      <div class="ft">This receipt confirms rent payment. Keep for your records.</div>
      </body></html>`)
      w.document.close(); w.focus(); w.print()
    } catch { toast('Could not load receipt.', 'error') }
  }

  if (loading || !p) return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <i className="ti ti-loader-2" style={{ fontSize: 28, animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  const allPayments  = payments
  const paid         = paidThisCycle(allPayments, p.start_date)
  const bal          = cycleBalance(allPayments, p.start_date, p.yearly_rent)
  const badge        = statusBadge(allPayments, p.start_date, p.yearly_rent)
  const nd           = p.start_date ? nextDueDate(p.start_date) : null
  const cycles       = buildCycleHistory(allPayments, p.start_date, p.yearly_rent)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar">{initials(p.tenant_name || '')}</div>
            <div>
              <div className="modal-title">{p.tenant_name || p.address}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.occupation}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge ${badge.cls}`}>{badge.label}</span>
            <button className="btn btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 16 }} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          {['details', 'payments', 'cycles', 'notes'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: tab === t ? '2px solid var(--blue)' : '2px solid transparent',
              color: tab === t ? 'var(--blue)' : 'var(--text-2)', marginBottom: '-1px',
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Details tab ── */}
        {tab === 'details' && (
          <div>
            <div className="grid-2" style={{ gap: 12 }}>
              <InfoSection title="Tenant">
                <InfoRow label="Name"       value={p.tenant_name} />
                <InfoRow label="Occupation" value={p.occupation} />
                <InfoRow label="Phone"      value={p.tenant_phone} />
                <InfoRow label="Email"      value={p.tenant_email} />
              </InfoSection>
              <InfoSection title="Property">
                <InfoRow label="Address" value={p.address} />
                <InfoRow label="City"    value={p.city} />
                <InfoRow label="State"   value={p.state} />
                <InfoRow label="Country" value={p.country} />
              </InfoSection>
              <InfoSection title="Lease dates">
                <InfoRow label="Move-in date"     value={fmtDate(p.move_in_date)} />
                <InfoRow label="Rent commenced"   value={fmtDate(p.start_date)} />
                <InfoRow label="Fixed annual due" value={p.start_date ? fixedDueLabel(p.start_date) : '—'} valueColor="var(--blue)" />
                <InfoRow label="Next due date"    value={nd ? fmtDate(nd.toISOString().slice(0, 10)) : '—'} />
                <InfoRow label="Lease duration"   value={`${p.duration_months} months`} />
              </InfoSection>
              <InfoSection title="Current cycle">
                <InfoRow label="Yearly rent"         value={fmtMoney(p.yearly_rent)} />
                <InfoRow label="Paid this cycle"     value={fmtMoney(paid)}  valueColor="var(--green)" />
                {bal > 0 && <InfoRow label="Balance outstanding" value={fmtMoney(bal)} valueColor="var(--red)" />}
                <InfoRow label="Total ever paid"     value={fmtMoney(totalEverPaid(allPayments))} />
              </InfoSection>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {p.lease_id && (
                <button className="btn btn-sm btn-primary" onClick={() => onRenew(p.lease_id)}>
                  <i className="ti ti-refresh" style={{ fontSize: 13 }} /> Renew lease
                </button>
              )}
              <button className="btn btn-sm btn-danger" onClick={onDelete}>
                <i className="ti ti-trash" style={{ fontSize: 13 }} /> Delete property
              </button>
            </div>
          </div>
        )}

        {/* ── Payments tab ── */}
        {tab === 'payments' && (
          <div>
            {/* Record payment form */}
            <form onSubmit={addPayment}
              style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                Record new payment
              </div>
              {bal > 0 && (
                <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8, padding: '6px 10px', background: 'var(--red-bg)', borderRadius: 'var(--radius)' }}>
                  <i className="ti ti-alert-circle" style={{ fontSize: 13, marginRight: 4 }} />
                  Balance outstanding this cycle: <strong>{fmtMoney(bal)}</strong>
                </div>
              )}
              <div className="grid-2" style={{ marginBottom: 10 }}>
                <div className="field">
                  <label>Amount paid (₦)</label>
                  <input type="number" step="0.01" value={payForm.amount}
                    onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder={p.yearly_rent} required />
                </div>
                <div className="field">
                  <label>Payment date</label>
                  <input type="date" value={payForm.paid_date}
                    onChange={e => setPayForm(f => ({ ...f, paid_date: e.target.value }))} required />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <label>Note (optional)</label>
                <input value={payForm.note}
                  onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))}
                  placeholder={`e.g. Part payment — balance ${fmtMoney(bal)} pending`} />
              </div>
              <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                <i className="ti ti-plus" style={{ fontSize: 13 }} /> {saving ? 'Saving…' : 'Add payment'}
              </button>
            </form>

            {/* Payment history table */}
            {payments.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '1.5rem' }}>No payments recorded yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl">
                  <thead>
                    <tr><th>Date</th><th>Amount</th><th>Note</th><th>Receipt</th><th></th></tr>
                  </thead>
                  <tbody>
                    {payments.map(pay => (
                      <tr key={pay.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(pay.paid_date)}</td>
                        <td style={{ color: 'var(--green)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtMoney(pay.amount)}</td>
                        <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{pay.note || '—'}</td>
                        <td><button className="btn btn-sm" onClick={() => showReceipt(pay.id)}><i className="ti ti-receipt" style={{ fontSize: 12 }} /> View</button></td>
                        <td><button className="btn btn-sm btn-danger" onClick={() => deletePayment(pay.id)}><i className="ti ti-trash" style={{ fontSize: 12 }} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Cycles tab ── */}
        {tab === 'cycles' && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
              Each row is one 12-month cycle. The due date is always <strong style={{ color: 'var(--blue)' }}>{p.start_date ? fixedDueLabel(p.start_date) : '—'}</strong>, regardless of when payment was made.
            </p>
            {cycles.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '1.5rem' }}>No cycle history yet.</p>
            ) : (
              cycles.map((cy, i) => {
                const pct = p.yearly_rent ? Math.min(100, Math.round((cy.paid / p.yearly_rent) * 100)) : 0
                return (
                  <div key={i} style={{
                    border: `1px solid ${cy.isCurrent ? 'var(--blue)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: 10,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {fmtDate(cy.start.toISOString().slice(0, 10))} — {fmtDate(cy.end.toISOString().slice(0, 10))}
                      </div>
                      {cy.isCurrent
                        ? <span className="badge badge-blue">Current cycle</span>
                        : cy.balance <= 0
                          ? <span className="badge badge-green">Fully paid</span>
                          : <span className="badge badge-red">Partially paid</span>
                      }
                    </div>
                    {/* Progress bar */}
                    <div className="prog" style={{ marginBottom: 6 }}>
                      <div className="prog-fill" style={{ width: `${pct}%`, background: cy.balance <= 0 ? '#639922' : '#378ADD' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: cy.payments.length ? 8 : 0 }}>
                      <span>Paid: <strong style={{ color: 'var(--green)' }}>{fmtMoney(cy.paid)}</strong></span>
                      {cy.balance > 0
                        ? <span>Outstanding: <strong style={{ color: 'var(--red)' }}>{fmtMoney(cy.balance)}</strong></span>
                        : <span style={{ color: 'var(--green)', fontWeight: 600 }}>Fully paid ✓</span>
                      }
                    </div>
                    {cy.payments.map((pay, j) => (
                      <div key={j} style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: 11, padding: '3px 0', borderTop: '1px solid var(--border)',
                        color: 'var(--text-2)',
                      }}>
                        <span>{fmtDate(pay.paid_date || pay.date)}{pay.note ? ' · ' + pay.note : ''}</span>
                        <span style={{ fontWeight: 600, color: 'var(--green)' }}>{fmtMoney(pay.amount || pay.amt)}</span>
                      </div>
                    ))}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Notes tab ── */}
        {tab === 'notes' && (
          <NotesEditor propId={p.id} current={p.notes} toast={toast}
            onSaved={notes => setP(prev => ({ ...prev, notes }))} />
        )}
      </div>
    </div>
  )
}

// ─── Add property modal ────────────────────────────────────────────────────────
function AddPropertyModal({ onClose, onSaved }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm] = useState({
    address: '', city: '', state: '', country: 'Nigeria',
    tenant_name: '', occupation: '', phone: '', email: '', notes: '',
    move_in_date: '', start_date: '', yearly_rent: '', duration_months: '12',
  })
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  async function submit(e) {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/api/properties', {
        ...form,
        yearly_rent:     parseFloat(form.yearly_rent),
        duration_months: parseInt(form.duration_months),
      })
      toast('Property added!')
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save.')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add property</span>
          <button className="btn btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 16 }} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="section-title" style={{ marginTop: 0 }}>Property location</div>
          <div className="grid-2">
            <div className="field"><label>Address *</label><input value={form.address} onChange={e => set('address', e.target.value)} placeholder="12 Bode Thomas St, VI" required /></div>
            <div className="field"><label>City *</label><input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lagos" required /></div>
            <div className="field"><label>State *</label><input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Lagos State" required /></div>
            <div className="field"><label>Country</label><input value={form.country} onChange={e => set('country', e.target.value)} /></div>
          </div>

          <div className="section-title">Tenant details</div>
          <div className="grid-2">
            <div className="field"><label>Full name *</label><input value={form.tenant_name} onChange={e => set('tenant_name', e.target.value)} placeholder="Oluwaseun Adeyemi" required /></div>
            <div className="field"><label>Occupation</label><input value={form.occupation} onChange={e => set('occupation', e.target.value)} placeholder="Accountant" /></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+234 803 000 0000" /></div>
            <div className="field"><label>Email</label><input value={form.email} onChange={e => set('email', e.target.value)} placeholder="tenant@email.com" /></div>
          </div>

          <div className="section-title">Lease dates &amp; rent</div>
          <div className="grid-2">
            <div className="field">
              <label>Date tenant moved in *</label>
              <input type="date" value={form.move_in_date} onChange={e => set('move_in_date', e.target.value)} required />
            </div>
            <div className="field">
              <label>
                Rent commencement date *
                <span style={{ color: 'var(--blue)', fontSize: 10, marginLeft: 4 }}>(sets permanent annual due date)</span>
              </label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} required />
            </div>
            <div className="field">
              <label>Yearly rent (₦) *</label>
              <input type="number" step="0.01" value={form.yearly_rent} onChange={e => set('yearly_rent', e.target.value)} placeholder="900000.00" required />
            </div>
            <div className="field">
              <label>Lease duration</label>
              <select value={form.duration_months} onChange={e => set('duration_months', e.target.value)}>
                <option value="6">6 months</option>
                <option value="12">1 year</option>
                <option value="24">2 years</option>
                <option value="36">3 years</option>
              </select>
            </div>
          </div>

          <div className="field" style={{ marginTop: 8 }}>
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="e.g. Parking slot A1 allocated. No pets clause agreed." />
          </div>

          {/* Live preview of fixed due date */}
          {form.start_date && (
            <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 6, padding: '6px 10px', background: 'var(--blue-bg)', borderRadius: 'var(--radius)' }}>
              <i className="ti ti-calendar" style={{ fontSize: 13, marginRight: 4 }} />
              Annual due date will be fixed at: <strong>
                {new Date(form.start_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} every year
              </strong>
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : <><i className="ti ti-check" style={{ fontSize: 14 }} /> Save property</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Notes editor ──────────────────────────────────────────────────────────────
function NotesEditor({ propId, current, toast, onSaved }) {
  const [notes, setNotes]   = useState(current || '')
  const [saving, setSaving] = useState(false)
  async function save() {
    setSaving(true)
    try { await api.put(`/api/properties/${propId}`, { notes }); toast('Notes saved.'); onSaved(notes) }
    catch { toast('Failed.', 'error') }
    finally { setSaving(false) }
  }
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, minHeight: 40, marginBottom: 10 }}>
        {notes || <span style={{ color: 'var(--text-3)' }}>No notes yet.</span>}
      </p>
      <textarea value={notes} onChange={e => setNotes(e.target.value)}
        style={{ width: '100%', minHeight: 100, padding: '8px 10px', fontSize: 13, borderRadius: 'var(--radius)', border: '1px solid var(--border-md)', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical', fontFamily: 'var(--font)' }}
        placeholder="Add notes about this tenant or property…" />
      <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save notes'}
      </button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function InfoSection({ title, children }) {
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '.85rem' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}
function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontWeight: 500, color: valueColor || 'var(--text)', textAlign: 'right', maxWidth: '55%' }}>{value || '—'}</span>
    </div>
  )
}
function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <i className="ti ti-loader-2" style={{ fontSize: 28, color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
