export function fmtMoney(n) {
  return '₦' + Number(n || 0).toLocaleString('en-NG')
}

export function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function initials(name = '') {
  return name.trim().split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
}

export function daysLeft(endDate) {
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((end - today) / 86400000)
}

export function leaseStatus(endDate) {
  const d = daysLeft(endDate)
  if (d < 0) return 'expired'
  if (d <= 60) return 'warn'
  return 'active'
}

export function statusBadge(endDate) {
  const d = daysLeft(endDate)
  const st = leaseStatus(endDate)
  if (st === 'expired') return { cls: 'badge-red',   label: `Expired ${Math.abs(d)}d ago` }
  if (st === 'warn')    return { cls: 'badge-amber', label: `${d}d left` }
  return                       { cls: 'badge-green', label: 'Active' }
}

export function leaseProgress(startDate, endDate) {
  const start = new Date(startDate)
  const end   = new Date(endDate)
  const today = new Date()
  const total = end - start
  const elapsed = Math.min(Math.max(today - start, 0), total)
  return Math.round((elapsed / total) * 100)
}

export function progressColor(endDate) {
  const st = leaseStatus(endDate)
  if (st === 'expired') return '#E24B4A'
  if (st === 'warn')    return '#EF9F27'
  return '#639922'
}
