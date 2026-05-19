import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import {
  fmtMoney, fmtDate, statusBadge, statusColor,
  paidThisCycle, cycleBalance, daysToNext, fixedDueLabel,
  nextDueDate, leaseStatus, totalEverPaid, buildCycleHistory, initials,
} from '../utils/helpers'

const HOUSE_TYPES = [
  'Apartment',
  'Studio Room',
  'Duplex',
  'Block of Flats',
  'Bungalow',
  'Terraced House',
  'Detached House',
  'Mini Flat',
  'Room & Parlour',
  'Shop / Commercial',
  'Other',
]

export default function PropertiesPage() {
  const [props, setProps]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [editing, setEditing]   = useState(null)   // property object to edit
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
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Properties</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{props.length} / 5 properties</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} disabled={props.length >= 5}>
          <i className="ti ti-plus" style={{ fontSize: 14 }} /> Add property
        </button>
      </div>

      {props.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <i className="ti ti-building-estate" style={{ fontSize: 40, color: 'var(--text-3)', display: 'block', marginBottom: 12 }} />
          <p style={{ fontWeight: 700, marginBottom: 4 }}>No properties yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Add your first property to get started</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <i className="ti ti-plus" style={{ fontSize: 14 }} /> Add property
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 12 }}>
          {props.map(p => (
            <PropCard key={p.id} p={p}
              onClick={() => setSelected(p)}
              onEdit={e => { e.stopPropagation(); setEditing(p) }}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <PropertyFormModal
          mode="add"
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load() }}
        />
      )}

      {editing && (
        <PropertyFormModal
          mode="edit"
          property={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); setSelected(null) }}
        />
      )}

      {selected && !editing && (
        <PropertyDetailModal
          propId={selected.id}
          onClose={() => setSelected(null)}
          onDelete={() => deleteProp(selected.id)}
          onEdit={() => setEditing(selected)}
          onRenew={renewLease}
          onRefresh={load}
          toast={toast}
        />
      )}
    </div>
  )
}

// ─── Property card ─────────────────────────────────────────────────────────────
function PropCard({ p, onClick, onEdit }) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{p.address}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{p.city}, {p.state}</div>
          {p.house_type && (
            <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--navy-bg)', color: 'var(--navy)' }}>
              {p.house_type}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className={`badge ${badge.cls}`} style={{ flexShrink: 0 }}>{badge.label}</span>
          <button
            onClick={onEdit}
            style={{ background: 'none', border: '1px solid var(--border-md)', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-pencil" style={{ fontSize: 11 }} /> Edit
          </button>
        </div>
      </div>

      {p.tenant_name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(p.tenant_name)}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{p.tenant_name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{p.occupation}</div>
          </div>
        </div>
      )}

      <div className="prog" style={{ margin: '4px 0 2px' }}>
        <div className="prog-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right', marginBottom: 6 }}>{pct}% of annual rent paid</div>

      <Row label="Fixed annual due" value={p.start_date ? fixedDueLabel(p.start_date) : '—'} valueColor="var(--navy)" />
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

// ─── Shared property form (Add + Edit) ────────────────────────────────────────
function PropertyFormModal({ mode, property, onClose, onSaved }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const blank = {
    address: '', city: '', state: '', country: 'Nigeria',
    house_type: 'Apartment',
    tenant_name: '', occupation: '', phone: '', email: '', notes: '',
    move_in_date: '', start_date: '', yearly_rent: '', duration_months: '12',
  }

  const [form, setForm] = useState(() => {
    if (mode === 'edit' && property) {
      return {
        address:         property.address        || '',
        city:            property.city           || '',
        state:           property.state          || '',
        country:         property.country        || 'Nigeria',
        house_type:      property.house_type     || 'Apartment',
        tenant_name:     property.tenant_name    || '',
        occupation:      property.occupation     || '',
        phone:           property.tenant_phone   || '',
        email:           property.tenant_email   || '',
        notes:           property.notes          || '',
        move_in_date:    property.move_in_date   || '',
        start_date:      property.start_date     || '',
        yearly_rent:     property.yearly_rent    ? String(property.yearly_rent) : '',
        duration_months: property.duration_months ? String(property.duration_months) : '12',
      }
    }
    return blank
  })

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  async function submit(e) {
    e.preventDefault(); setSaving(true)
    try {
      const payload = {
        ...form,
        yearly_rent:     parseFloat(form.yearly_rent),
        duration_months: parseInt(form.duration_months),
      }
      if (mode === 'add') {
        await api.post('/api/properties', payload)
        toast('Property added!')
      } else {
        await api.put(`/api/properties/${property.id}`, payload)
        toast('Property updated!')
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save.')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{mode === 'add' ? 'Add property' : 'Edit property'}</span>
          <button className="btn btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 16 }} /></button>
        </div>

        <form onSubmit={submit}>
          {/* ── Property location ── */}
          <div className="section-title" style={{ marginTop: 0 }}>Property location</div>
          <div className="grid-2">
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Address *</label>
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="12 Bode Thomas St, VI" required />
            </div>
            <div className="field"><label>City *</label><input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lagos" required /></div>
            <div className="field"><label>State *</label><input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Lagos State" required /></div>
            <div className="field"><label>Country</label><input value={form.country} onChange={e => set('country', e.target.value)} /></div>
            <div className="field">
              <label>House type</label>
              <select value={form.house_type} onChange={e => set('house_type', e.target.value)}>
                {HOUSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* ── Tenant details ── */}
          <div className="section-title">Tenant details</div>
          <div className="grid-2">
            <div className="field"><label>Full name *</label><input value={form.tenant_name} onChange={e => set('tenant_name', e.target.value)} placeholder="Oluwaseun Adeyemi" required /></div>
            <div className="field"><label>Occupation</label><input value={form.occupation} onChange={e => set('occupation', e.target.value)} placeholder="Accountant" /></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+234 803 000 0000" /></div>
            <div className="field"><label>Email</label><input value={form.email} onChange={e => set('email', e.target.value)} placeholder="tenant@email.com" /></div>
          </div>

          {/* ── Lease dates & rent ── */}
          <div className="section-title">Lease dates &amp; rent</div>
          <div className="grid-2">
            <div className="field">
              <label>Date tenant moved in *</label>
              <input type="date" value={form.move_in_date} onChange={e => set('move_in_date', e.target.value)} required />
            </div>
            <div className="field">
              <label>
                Rent commencement date *
                <span style={{ color: 'var(--navy)', fontSize: 10, marginLeft: 4 }}>(sets annual due date)</span>
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

          {form.start_date && (
            <div style={{ fontSize: 12, color: 'var(--navy)', marginTop: 8, padding: '6px 10px', background: 'var(--navy-bg)', borderRadius: 'var(--radius)' }}>
              <i className="ti ti-calendar" style={{ fontSize: 13, marginRight: 4 }} />
              Annual due date fixed at: <strong>
                {new Date(form.start_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} every year
              </strong>
            </div>
          )}

          {/* ── Notes ── */}
          <div className="section-title">Notes</div>
          <div className="field">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="e.g. Parking slot A1. No pets. Agreement on painting." />
          </div>

          {error && <p className="error-msg" style={{ marginTop: 8 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? <><i className="ti ti-loader-2" style={{ fontSize: 14, animation: 'spin 1s linear infinite' }} /> Saving…</>
                : <><i className="ti ti-check" style={{ fontSize: 14 }} /> {mode === 'add' ? 'Save property' : 'Save changes'}</>
              }
            </button>
          </div>
        </form>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}

// ─── Detail modal ──────────────────────────────────────────────────────────────
function PropertyDetailModal({ propId, onClose, onDelete, onEdit, onRenew, onRefresh, toast }) {
  const [p, setP]               = useState(null)
  const [payments, setPayments] = useState([])
  const [tab, setTab]           = useState('details')
  const [loading, setLoading]   = useState(true)
  const [payForm, setPayForm]   = useState({ amount: '', paid_date: new Date().toISOString().slice(0, 10), note: '' })
  const [saving, setSaving]     = useState(false)

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
      .amt{font-size:26px;font-weight:700;color:#0F2044;text-align:center;padding:14px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:14px 0}
      .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f5f5f5;font-size:13px}
      .lbl{color:#666}.val{font-weight:500}.ft{text-align:center;font-size:11px;color:#aaa;margin-top:16px}
      </style></head><body>
      <h2>Rent Payment Receipt</h2><div class="sub">${rc.receipt_no}</div>
      <div class="amt">₦${parseFloat(rc.amount).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
      <div class="row"><span class="lbl">Tenant</span><span class="val">${rc.tenant_name}</span></div>
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
      <div className="modal" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <i className="ti ti-loader-2" style={{ fontSize: 28, animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  const allPayments = payments
  const paid        = paidThisCycle(allPayments, p.start_date)
  const bal         = cycleBalance(allPayments, p.start_date, p.yearly_rent)
  const badge       = statusBadge(allPayments, p.start_date, p.yearly_rent)
  const nd          = p.start_date ? nextDueDate(p.start_date) : null
  const cycles      = buildCycleHistory(allPayments, p.start_date, p.yearly_rent)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar" style={{ width: 38, height: 38, fontSize: 13 }}>{initials(p.tenant_name || '')}</div>
            <div>
              <div className="modal-title">{p.tenant_name || p.address}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {p.occupation}{p.house_type ? ` · ${p.house_type}` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge ${badge.cls}`}>{badge.label}</span>
            <button className="btn btn-sm" onClick={onEdit} title="Edit property">
              <i className="ti ti-pencil" style={{ fontSize: 13 }} /> Edit
            </button>
            <button className="btn btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 16 }} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1.5px solid var(--border)', marginBottom: 16 }}>
          {['details','payments','cycles','notes'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 14px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: tab === t ? '2px solid var(--navy)' : '2px solid transparent',
              color: tab === t ? 'var(--navy)' : 'var(--text-2)', marginBottom: '-2px',
              fontFamily: 'inherit',
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Details tab ── */}
        {tab === 'details' && (
          <div>
            <div className="grid-2" style={{ gap: 10 }}>
              <InfoSection title="Tenant">
                <InfoRow label="Name"       value={p.tenant_name} />
                <InfoRow label="Occupation" value={p.occupation} />
                <InfoRow label="Phone"      value={p.tenant_phone} />
                <InfoRow label="Email"      value={p.tenant_email} />
              </InfoSection>
              <InfoSection title="Property">
                <InfoRow label="Address"    value={p.address} />
                <InfoRow label="City"       value={p.city} />
                <InfoRow label="State"      value={p.state} />
                <InfoRow label="Country"    value={p.country} />
                <InfoRow label="House type" value={p.house_type} />
              </InfoSection>
              <InfoSection title="Lease dates">
                <InfoRow label="Move-in date"     value={fmtDate(p.move_in_date)} />
                <InfoRow label="Rent commenced"   value={fmtDate(p.start_date)} />
                <InfoRow label="Fixed annual due" value={p.start_date ? fixedDueLabel(p.start_date) : '—'} valueColor="var(--navy)" />
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
              <button className="btn btn-sm btn-primary" onClick={onEdit}>
                <i className="ti ti-pencil" style={{ fontSize: 13 }} /> Edit property
              </button>
              {p.lease_id && (
                <button className="btn btn-sm" onClick={() => onRenew(p.lease_id)}>
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
            <form onSubmit={addPayment} style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                Record new payment
              </div>
              {bal > 0 && (
                <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8, padding: '6px 10px', background: 'var(--red-bg)', borderRadius: 'var(--radius)' }}>
                  <i className="ti ti-alert-circle" style={{ fontSize: 13, marginRight: 4 }} />
                  Balance outstanding: <strong>{fmtMoney(bal)}</strong>
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
                  placeholder="e.g. Part payment, balance pending" />
              </div>
              <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                <i className="ti ti-plus" style={{ fontSize: 13 }} /> {saving ? 'Saving…' : 'Add payment'}
              </button>
            </form>

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
              Each row is one 12-month cycle. Due date is always <strong style={{ color: 'var(--navy)' }}>{p.start_date ? fixedDueLabel(p.start_date) : '—'}</strong>.
            </p>
            {cycles.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '1.5rem' }}>No cycle history yet.</p>
            ) : cycles.map((cy, i) => {
              const pct = p.yearly_rent ? Math.min(100, Math.round((cy.paid / p.yearly_rent) * 100)) : 0
              return (
                <div key={i} style={{ border: `1.5px solid ${cy.isCurrent ? 'var(--navy)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {fmtDate(cy.start.toISOString().slice(0, 10))} — {fmtDate(cy.end.toISOString().slice(0, 10))}
                    </div>
                    {cy.isCurrent
                      ? <span className="badge badge-blue">Current</span>
                      : cy.balance <= 0
                        ? <span className="badge badge-green">Fully paid</span>
                        : <span className="badge badge-red">Partial</span>
                    }
                  </div>
                  <div className="prog" style={{ marginBottom: 6 }}>
                    <div className="prog-fill" style={{ width: `${pct}%`, background: cy.balance <= 0 ? 'var(--green)' : 'var(--navy)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: cy.payments.length ? 8 : 0 }}>
                    <span>Paid: <strong style={{ color: 'var(--green)' }}>{fmtMoney(cy.paid)}</strong></span>
                    {cy.balance > 0
                      ? <span>Outstanding: <strong style={{ color: 'var(--red)' }}>{fmtMoney(cy.balance)}</strong></span>
                      : <span style={{ color: 'var(--green)', fontWeight: 600 }}>Fully paid ✓</span>
                    }
                  </div>
                  {cy.payments.map((pay, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderTop: '1px solid var(--border)', color: 'var(--text-2)' }}>
                      <span>{fmtDate(pay.paid_date || pay.date)}{pay.note ? ' · ' + pay.note : ''}</span>
                      <span style={{ fontWeight: 600, color: 'var(--green)' }}>{fmtMoney(pay.amount || pay.amt)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Notes tab ── */}
        {tab === 'notes' && (
          <NotesEditor propId={p.id} current={p.notes} toast={toast}
            onSaved={notes => setP(prev => ({ ...prev, notes }))} />
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
      <textarea value={notes} onChange={e => setNotes(e.target.value)}
        style={{ width: '100%', minHeight: 120, padding: '10px 12px', fontSize: 13, borderRadius: 'var(--radius)', border: '1.5px solid var(--border-md)', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical', fontFamily: 'var(--font)' }}
        placeholder="Add notes about this tenant or property…" />
      <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save notes'}
      </button>
    </div>
  )
}

function InfoSection({ title, children }) {
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '.85rem' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}
function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: valueColor || 'var(--text)', textAlign: 'right', maxWidth: '55%' }}>{value || '—'}</span>
    </div>
  )
}
function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <i className="ti ti-loader-2" style={{ fontSize: 28, color: 'var(--navy)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
