// ─── Money ────────────────────────────────────────────────────────────────────
export function fmtMoney(n) {
  return '₦' + parseFloat(n || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })
}

// ─── Date ─────────────────────────────────────────────────────────────────────
export function fmtDate(str) {
  if (!str) return '—'
  const d = new Date(str + 'T00:00:00')
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Initials ─────────────────────────────────────────────────────────────────
export function initials(name = '') {
  return name.trim().split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function today() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime())
}

function parseDate(str) {
  if (!str) return null
  const d = new Date(str + 'T00:00:00')
  return isValidDate(d) ? d : null
}

// ─── Fixed annual due date logic ──────────────────────────────────────────────
// Returns the start of the current 12-month cycle.
// SAFE: max 100 iterations, returns null on bad input.
export function cycleStart(startDateStr) {
  const s = parseDate(startDateStr)
  if (!s) return null
  const now = today()
  // If start is in the future, current cycle started on the start date
  if (s > now) return s
  let cy = new Date(s)
  for (let i = 0; i < 100; i++) {
    const next = new Date(cy)
    next.setFullYear(next.getFullYear() + 1)
    if (next > now) break
    cy = next
  }
  return cy
}

export function cycleEnd(startDateStr) {
  const cs = cycleStart(startDateStr)
  if (!cs) return null
  const ce = new Date(cs)
  ce.setFullYear(ce.getFullYear() + 1)
  ce.setDate(ce.getDate() - 1)
  return ce
}

export function nextDueDate(startDateStr) {
  const cs = cycleStart(startDateStr)
  if (!cs) return null
  const nd = new Date(cs)
  nd.setFullYear(nd.getFullYear() + 1)
  return nd
}

export function daysToNext(startDateStr) {
  const nd = nextDueDate(startDateStr)
  if (!nd) return 0
  return Math.round((nd - today()) / 86400000)
}

export function fixedDueLabel(startDateStr) {
  const d = parseDate(startDateStr)
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' every year'
}

// ─── Cycle payment calculations ───────────────────────────────────────────────
export function paidThisCycle(payments = [], startDateStr) {
  if (!startDateStr) return 0
  const cs = cycleStart(startDateStr)
  if (!cs) return 0
  const ce = new Date(cs)
  ce.setFullYear(ce.getFullYear() + 1)
  return payments
    .filter(x => {
      const d = parseDate(x.paid_date || x.date)
      return d && d >= cs && d < ce
    })
    .reduce((sum, x) => sum + parseFloat(x.amount || x.amt || 0), 0)
}

export function cycleBalance(payments = [], startDateStr, yearlyRent) {
  return Math.max(0, parseFloat(yearlyRent || 0) - paidThisCycle(payments, startDateStr))
}

export function totalEverPaid(payments = []) {
  return payments.reduce((s, x) => s + parseFloat(x.amount || x.amt || 0), 0)
}

// ─── Status ───────────────────────────────────────────────────────────────────
export function leaseStatus(payments = [], startDateStr, yearlyRent) {
  if (!startDateStr || !yearlyRent) return 'unknown'
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
  if (st === 'unknown') return { cls: 'badge-blue',  label: 'No lease' }
  return                       { cls: 'badge-blue',  label: 'Partial' }
}

export function statusColor(payments = [], startDateStr, yearlyRent) {
  const st = leaseStatus(payments, startDateStr, yearlyRent)
  if (st === 'paid')    return '#1A6B2E'
  if (st === 'overdue') return '#981F1F'
  if (st === 'warn')    return '#7A4200'
  if (st === 'unknown') return '#6878A0'
  return '#1A3460'
}

// ─── Cycle history ────────────────────────────────────────────────────────────
export function buildCycleHistory(payments = [], startDateStr, yearlyRent) {
  if (!startDateStr || !yearlyRent) return []
  const startD = parseDate(startDateStr)
  if (!startD) return []
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
      const d = parseDate(x.paid_date || x.date)
      return d && d >= cy && d < cyEndInclusive
    })
    const cyPaid    = cyPays.reduce((s, x) => s + parseFloat(x.amount || x.amt || 0), 0)
    const cyBalance = Math.max(0, parseFloat(yearlyRent) - cyPaid)

    cycles.push({
      start:     new Date(cy),
      end:       cyEnd,
      paid:      cyPaid,
      balance:   cyBalance,
      payments:  cyPays,
      isCurrent: false,
    })
    cy = new Date(cy)
    cy.setFullYear(cy.getFullYear() + 1)
  }

  if (cycles.length) cycles[cycles.length - 1].isCurrent = true
  return cycles
}
