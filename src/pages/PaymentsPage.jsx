import { useState, useEffect } from 'react'
import api from '../utils/api'
import { fmtDate, fmtMoney } from '../utils/helpers'
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

  const total = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'60vh' }}>
      <i className="ti ti-loader-2" style={{ fontSize:28,color:'var(--text-3)',animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:20,fontWeight:600 }}>Payment history</h1>
        <p style={{ fontSize:13,color:'var(--text-2)',marginTop:2 }}>All rent payments across your properties</p>
      </div>

      <div className="grid-3" style={{ marginBottom:'1.5rem' }}>
        <div className="stat-card"><div className="lbl">Total payments</div><div className="val">{payments.length}</div></div>
        <div className="stat-card"><div className="lbl">Total collected</div><div className="val" style={{ fontSize:16,paddingTop:4 }}>{fmtMoney(total)}</div></div>
        <div className="stat-card"><div className="lbl">Properties paid</div><div className="val">{new Set(payments.map(p=>p.property_id)).size}</div></div>
      </div>

      {payments.length === 0 ? (
        <div style={{ textAlign:'center',padding:'3rem',color:'var(--text-3)' }}>
          <i className="ti ti-cash" style={{ fontSize:40,display:'block',marginBottom:12 }} />
          <p style={{ fontWeight:600,marginBottom:4 }}>No payments yet</p>
          <p style={{ fontSize:13 }}>Add a property and record your first payment</p>
        </div>
      ) : (
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Amount</th>
                  <th>Note</th>
                  <th>Receipt</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace:'nowrap' }}>{fmtDate(p.paid_date)}</td>
                    <td style={{ fontWeight:500 }}>{p.tenant_name}</td>
                    <td style={{ color:'var(--text-2)',fontSize:12 }}>{p.address}, {p.city}</td>
                    <td style={{ color:'var(--green)',fontWeight:600,whiteSpace:'nowrap' }}>₦{Number(p.amount).toLocaleString('en-NG')}</td>
                    <td style={{ color:'var(--text-2)',fontSize:12 }}>{p.note || '—'}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => loadReceipt(p.id)}>
                        <i className="ti ti-receipt" style={{ fontSize:12 }} /> View
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => del(p.id)}>
                        <i className="ti ti-trash" style={{ fontSize:12 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {receipt && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth:460 }}>
            <div className="modal-header">
              <span className="modal-title"><i className="ti ti-receipt" style={{ marginRight:6,fontSize:16 }} />Receipt</span>
              <div style={{ display:'flex',gap:8 }}>
                <button className="btn btn-sm btn-primary" onClick={() => {
                  const w = window.open('','_blank','width=540,height=660')
                  w.document.write(`<html><head><title>Receipt</title>
                  <style>body{font-family:sans-serif;padding:30px;max-width:460px;margin:0 auto}
                  h2{text-align:center;font-size:17px}.sub{text-align:center;font-size:12px;color:#888;margin-bottom:16px}
                  .amt{font-size:26px;font-weight:700;color:#27500A;text-align:center;padding:14px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:14px 0}
                  .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f5f5f5;font-size:13px}
                  .lbl{color:#666}.val{font-weight:500}.ft{text-align:center;font-size:11px;color:#aaa;margin-top:18px}</style>
                  </head><body>
                  <h2>Rent Payment Receipt</h2>
                  <div class="sub">${receipt.receipt_no}</div>
                  <div class="amt">₦${Number(receipt.amount).toLocaleString('en-NG')}</div>
                  <div class="row"><span class="lbl">Tenant</span><span class="val">${receipt.tenant_name}</span></div>
                  <div class="row"><span class="lbl">Property</span><span class="val">${receipt.address}, ${receipt.city}</span></div>
                  <div class="row"><span class="lbl">Payment date</span><span class="val">${fmtDate(receipt.paid_date)}</span></div>
                  <div class="row"><span class="lbl">Lease period</span><span class="val">${fmtDate(receipt.start_date)} — ${fmtDate(receipt.end_date)}</span></div>
                  ${receipt.note?`<div class="row"><span class="lbl">Note</span><span class="val">${receipt.note}</span></div>`:''}
                  <div class="ft">Keep this receipt for your records.</div>
                  </body></html>`)
                  w.document.close(); w.focus(); w.print()
                }}>
                  <i className="ti ti-printer" style={{ fontSize:13 }} /> Print
                </button>
                <button className="btn btn-sm" onClick={() => setReceipt(null)}><i className="ti ti-x" style={{ fontSize:13 }} /></button>
              </div>
            </div>
            <div style={{ background:'var(--bg)',borderRadius:'var(--radius)',padding:'1rem',textAlign:'center',marginBottom:14 }}>
              <div style={{ fontSize:11,color:'var(--text-3)',marginBottom:4 }}>{receipt.receipt_no}</div>
              <div style={{ fontSize:26,fontWeight:700,color:'var(--green)' }}>₦{Number(receipt.amount).toLocaleString('en-NG')}</div>
            </div>
            {[['Tenant',receipt.tenant_name],['Property',`${receipt.address}, ${receipt.city}`],
              ['Payment date',fmtDate(receipt.paid_date)],
              ['Lease period',`${fmtDate(receipt.start_date)} — ${fmtDate(receipt.end_date)}`],
              receipt.note&&['Note',receipt.note]].filter(Boolean).map(([l,v])=>(
              <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:13 }}>
                <span style={{ color:'var(--text-2)' }}>{l}</span><span style={{ fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
