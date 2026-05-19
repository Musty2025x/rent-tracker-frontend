// ─── Money ────────────────────────────────────────────────────────────────────
// Format: ₦900,000.00
export function fmtMoney(n) {
  return '₦' + parseFloat(n || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ─── Date ─────────────────────────────────────────────────────────────────────
// Format: 02 Jan 2025
export function fmtDate(str) {
  if (!str) return '—'
  return new Date(str + 'T00:00:00').toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

// ─── Initials ─────────────────────────────────────────────────────────────────
export function initials(name = '') {
  return name.trim().split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
}

// ─── Fixed annual due date logic ──────────────────────────────────────────────
// The rent commencement date fixes the day+month forever.
// e.g. commenced 15 Jan 2025 → due 15 Jan every year, regardless of when paid.

function today() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// Returns the start of the current 12-month cycle
export function cycleStart(startDateStr) {
  const s = new Date(startDateStr + 'T00:00:00')
  const now = today()
  let cy = new Date(s)
  while (true) {
    const next = new Date(cy)
    next.setFullYear(next.getFullYear() + 1)
    if (next > now) break
    cy = next
  }
  return cy
}

// Returns the last day of the current cycle (day before next anniversary)
export function cycleEnd(startDateStr) {
  const cs = cycleStart(startDateStr)
  const ce = new Date(cs)
  ce.setFullYear(ce.getFullYear() + 1)
  ce.setDate(ce.getDate() - 1)
  return ce
}

// Returns the next anniversary due date
export function nextDueDate(startDateStr) {
  const cs = cycleStart(startDateStr)
  const nd = new Date(cs)
  nd.setFullYear(nd.getFullYear() + 1)
  return nd
}

// Days until next due date (negative = overdue)
export function daysToNext(startDateStr) {
  return Math.round((nextDueDate(startDateStr) - today()) / 86400000)
}

// Human-readable fixed due label e.g. "15 Jan every year"
export function fixedDueLabel(startDateStr) {
  return new Date(startDateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short',
  }) + ' every year'
}

// ─── Cycle payment calculations ───────────────────────────────────────────────
// payments = array of { paid_date, amount } objects
// Only counts payments whose paid_date falls within the current 12-month cycle

export function paidThisCycle(payments = [], startDateStr) {
  if (!startDateStr) return 0
  const cs = cycleStart(startDateStr)
  const ce = new Date(cycleEnd(startDateStr).getTime() + 86400000) // +1 day inclusive
  return payments
    .filter(x => {
      const d = new Date((x.paid_date || x.date) + 'T00:00:00')
      return d >= cs && d < ce
    })
    .reduce((sum, x) => sum + parseFloat(x.amount || x.amt || 0), 0)
}

// Outstanding balance for current cycle
export function cycleBalance(payments = [], startDateStr, yearlyRent) {
  return Math.max(0, parseFloat(yearlyRent || 0) - paidThisCycle(payments, startDateStr))
}

// Total ever paid across all cycles
export function totalEverPaid(payments = []) {
  return payments.reduce((s, x) => s + parseFloat(x.amount || x.amt || 0), 0)
}

// ─── Status ───────────────────────────────────────────────────────────────────
// 'paid' | 'overdue' | 'warn' | 'partial'
export function leaseStatus(payments = [], startDateStr, yearlyRent) {
  const bal = cycleBalance(payments, startDateStr, yearlyRent)
  const d   = daysToNext(startDateStr)
  if (bal <= 0) return 'paid'
  if (d < 0)    return 'overdue'
  if (d <= 60)  return 'warn'
  return 'partial'
}

export function statusBadge(payments = [], startDateStr, yearlyRent) {
  const st = leaseStatus(payments, startDateStr, yearlyRent)
  const d  = daysToNext(startDateStr)
  if (st === 'paid')    return { cls: 'badge-green', label: 'Fully paid' }
  if (st === 'overdue') return { cls: 'badge-red',   label: `Overdue ${Math.abs(d)}d` }
  if (st === 'warn')    return { cls: 'badge-amber',  label: `${d}d to due` }
  return                       { cls: 'badge-blue',  label: 'Partial' }
}

export function statusColor(payments = [], startDateStr, yearlyRent) {
  const st = leaseStatus(payments, startDateStr, yearlyRent)
  if (st === 'paid')    return '#639922'
  if (st === 'overdue') return '#E24B4A'
  if (st === 'warn')    return '#EF9F27'
  return '#378ADD'
}

// ─── Cycle history (for detail view) ─────────────────────────────────────────
// Returns array of all past and current 12-month cycles with payment breakdown
export function buildCycleHistory(payments = [], startDateStr, yearlyRent) {
  if (!startDateStr) return []
  const startD = new Date(startDateStr + 'T00:00:00')
  const now    = today()
  const cycles = []
  let cy = new Date(startD)

  for (let i = 0; i < 20; i++) {
    if (cy > now) break
    const cyEnd = new Date(cy)
    cyEnd.setFullYear(cyEnd.getFullYear() + 1)
    cyEnd.setDate(cyEnd.getDate() - 1)
    const cyEndInclusive = new Date(cyEnd.getTime() + 86400000)

    const cyPays = payments.filter(x => {
      const d = new Date((x.paid_date || x.date) + 'T00:00:00')
      return d >= cy && d < cyEndInclusive
    })
    const cyPaid    = cyPays.reduce((s, x) => s + parseFloat(x.amount || x.amt || 0), 0)
    const cyBalance = Math.max(0, parseFloat(yearlyRent) - cyPaid)
    const isCurrent = i === 0 || (cy <= now && cyEndInclusive > now)

    cycles.push({
      start:     new Date(cy),
      end:       cyEnd,
      paid:      cyPaid,
      balance:   cyBalance,
      payments:  cyPays,
      isCurrent: false, // will mark below
    })
    cy = new Date(cy)
    cy.setFullYear(cy.getFullYear() + 1)
  }

  // Mark only the last entry as current
  if (cycles.length) cycles[cycles.length - 1].isCurrent = true
  return cycles
}
