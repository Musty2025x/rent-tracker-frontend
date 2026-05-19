import { useState, useEffect } from 'react'
import api from '../utils/api'
import { fmtDate, fmtMoney, totalEverPaid } from '../utils/helpers'
import { useToast } from '../context/ToastContext'

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [receipt, setReceipt]   = useState(null)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    api.get('/api/payments')
      .then(r => setPayments(r.data.payments || []))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function loadReceipt(id) {
    try {
      const r = await api.get(`/api/payments/${id}/receipt`)
      setReceipt(r.data.receipt)
    } catch { toast('Could not load receipt.', 'error') }
  }

  async function del(id) {
    if (!confirm('Delete this payment record?')) return
    try { await api.delete(`/api/payments/${id}`); toast('Payment deleted.'); load() }
    catch { toast('Failed to delete.', 'error') }
  }

  const total       = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const propCount   = new Set(payments.map(p => p.property_id)).size
  const thisMonth   = payments.filter(p => {
    const d = new Date(p.paid_date)
    const n = new Date()
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
  }).reduce((s, p) => s + parseFloat(p.amount || 0), 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <i className="ti ti-loader-2" style={{ fontSize: 28, color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Payment history</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>All rent payments across your properties</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: '1.5rem' }}>
        <div className="stat-card"><div className="lbl">Total payments</div><div className="val">{payments.length}</div></div>
        <div className="stat-card"><div className="lbl">Total collected</div><div className="val" style={{ fontSize: 14, paddingTop: 4 }}>{fmtMoney(total)}</div></div>
        <div className="stat-card"><div className="lbl">This month</div><div className="val" style={{ fontSize: 14, paddingTop: 4, color: 'var(--green)' }}>{fmtMoney(thisMonth)}</div></div>
        <div className="stat-card"><div className="lbl">Properties paid</div><div className="val">{propCount}</div></div>
      </div>

      {payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
          <i className="ti ti-cash" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No payments yet</p>
          <p style={{ fontSize: 13 }}>Record payments from the Properties page</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Amount paid</th>
                  <th>Note</th>
                  <th>Receipt</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(p.paid_date)}</td>
                    <td style={{ fontWeight: 500 }}>{p.tenant_name}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.address}, {p.city}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtMoney(p.amount)}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.note || '—'}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => loadReceipt(p.id)}>
                        <i className="ti ti-receipt" style={{ fontSize: 12 }} /> View
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => del(p.id)}>
                        <i className="ti ti-trash" style={{ fontSize: 12 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {receipt && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <span className="modal-title">
                <i className="ti ti-receipt" style={{ marginRight: 6, fontSize: 16 }} />
                Payment receipt
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-primary" onClick={() => printReceipt(receipt)}>
                  <i className="ti ti-printer" style={{ fontSize: 13 }} /> Print
                </button>
                <button className="btn btn-sm" onClick={() => setReceipt(null)}>
                  <i className="ti ti-x" style={{ fontSize: 13 }} />
                </button>
              </div>
            </div>

            {/* Amount */}
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Receipt No: {receipt.receipt_no}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--green)' }}>{fmtMoney(receipt.amount)}</div>
            </div>

            {/* Receipt rows */}
            {[
              ['Tenant',        receipt.tenant_name],
              ['Occupation',    receipt.occupation || '—'],
              ['Property',      `${receipt.address}, ${receipt.city}`],
              ['State / Country', `${receipt.state}, ${receipt.country}`],
              ['Payment date',  fmtDate(receipt.paid_date)],
              ['Annual due date', receipt.start_date
                ? new Date(receipt.start_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' every year'
                : '—'],
              receipt.note && ['Note', receipt.note],
            ].filter(Boolean).map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-2)' }}>{l}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}

            <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 14 }}>
              Keep this receipt for your records.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function printReceipt(rc) {
  const w = window.open('', '_blank', 'width=560,height=700')
  const dueLabel = rc.start_date
    ? new Date(rc.start_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' every year'
    : '—'
  w.document.write(`<html><head><title>Receipt ${rc.receipt_no}</title>
  <style>
    body{font-family:sans-serif;padding:32px;max-width:480px;margin:0 auto;color:#111}
    h2{text-align:center;font-size:18px;margin-bottom:2px}
    .sub{text-align:center;font-size:12px;color:#888;margin-bottom:18px}
    .amt{font-size:28px;font-weight:700;color:#27500A;text-align:center;
         padding:16px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:16px 0}
    .row{display:flex;justify-content:space-between;padding:6px 0;
         border-bottom:1px solid #f5f5f5;font-size:13px}
    .lbl{color:#666}.val{font-weight:500;text-align:right}
    .ft{text-align:center;font-size:11px;color:#aaa;margin-top:20px;line-height:1.6}
  </style>
  </head><body>
  <h2>Rent Payment Receipt</h2>
  <div class="sub">Receipt No: ${rc.receipt_no}</div>
  <div class="amt">₦${parseFloat(rc.amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
  <div class="row"><span class="lbl">Tenant</span><span class="val">${rc.tenant_name}</span></div>
  <div class="row"><span class="lbl">Occupation</span><span class="val">${rc.occupation || '—'}</span></div>
  <div class="row"><span class="lbl">Property</span><span class="val">${rc.address}, ${rc.city}</span></div>
  <div class="row"><span class="lbl">State / Country</span><span class="val">${rc.state}, ${rc.country}</span></div>
  <div class="row"><span class="lbl">Payment date</span><span class="val">${new Date(rc.paid_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
  <div class="row"><span class="lbl">Annual due date</span><span class="val">${dueLabel}</span></div>
  ${rc.note ? `<div class="row"><span class="lbl">Note</span><span class="val">${rc.note}</span></div>` : ''}
  <div class="ft">This receipt confirms rent payment for the above property.<br>Keep for your records.</div>
  </body></html>`)
  w.document.close(); w.focus(); w.print()
}
