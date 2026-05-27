import { format, subMonths, parseISO, getDay, getDate, isValid } from 'date-fns'

/**
 * Returns the average income over the last N months
 * @param {Array} incomeArr - array of income objects
 * @param {number} months - number of months to average
 * @returns {number} average income
 */
export function getRollingAverage(incomeArr, months = 3) {
  if (!incomeArr || incomeArr.length === 0) return 0

  const now = new Date()
  const monthTotals = []

  for (let i = 1; i <= months; i++) {
    const monthDate = subMonths(now, i)
    const monthKey = format(monthDate, 'yyyy-MM')
    const monthIncome = incomeArr
      .filter(inc => inc.month === monthKey)
      .reduce((sum, inc) => sum + Number(inc.amount), 0)
    monthTotals.push(monthIncome)
  }

  const nonZeroMonths = monthTotals.filter(t => t > 0)
  if (nonZeroMonths.length === 0) return 0
  return nonZeroMonths.reduce((a, b) => a + b, 0) / nonZeroMonths.length
}

/**
 * Returns total and per-category totals for a given month
 * @param {Array} expenses - array of expense objects
 * @param {string} month - 'YYYY-MM'
 * @returns {{ total: number, byCategory: Object }}
 */
export function getMonthlyTotals(expenses, month) {
  if (!expenses || !month) return { total: 0, byCategory: {} }

  const monthExpenses = expenses.filter(e => e.month === month)
  const byCategory = {}
  let total = 0

  monthExpenses.forEach(exp => {
    const amount = Number(exp.amount)
    total += amount
    byCategory[exp.category] = (byCategory[exp.category] || 0) + amount
  })

  return { total, byCategory }
}

/**
 * Determines budget health based on spent vs budgeted
 * @param {number} spent
 * @param {number} budgeted
 * @returns {'safe'|'warning'|'danger'|'unknown'}
 */
export function getBudgetHealth(spent, budgeted) {
  if (!budgeted || budgeted <= 0) return 'unknown'
  const pct = spent / budgeted
  if (pct < 0.7) return 'safe'
  if (pct < 0.9) return 'warning'
  return 'danger'
}

/**
 * Analyzes income pattern
 * @param {Array} incomeArr - array of income objects
 * @returns {{ avgLow: number, avgHigh: number, pattern: 'variable'|'stable' }}
 */
export function getIncomePattern(incomeArr) {
  if (!incomeArr || incomeArr.length === 0) {
    return { avgLow: 0, avgHigh: 0, pattern: 'stable' }
  }

  // Group by month
  const byMonth = {}
  incomeArr.forEach(inc => {
    if (!byMonth[inc.month]) byMonth[inc.month] = 0
    byMonth[inc.month] += Number(inc.amount)
  })

  const monthlyAmounts = Object.values(byMonth).filter(v => v > 0)
  if (monthlyAmounts.length < 2) {
    const avg = monthlyAmounts[0] || 0
    return { avgLow: avg, avgHigh: avg, pattern: 'stable' }
  }

  const sorted = [...monthlyAmounts].sort((a, b) => a - b)
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length
  const halfLen = Math.ceil(sorted.length / 2)
  const avgLow = sorted.slice(0, halfLen).reduce((a, b) => a + b, 0) / halfLen
  const avgHigh = sorted.slice(-halfLen).reduce((a, b) => a + b, 0) / halfLen

  // Consider variable if high is more than 30% above low
  const pattern = avgHigh > avgLow * 1.3 ? 'variable' : 'stable'
  return { avgLow, avgHigh, pattern }
}

/**
 * Gets income badge label based on current month vs rolling average
 * @param {number} currentMonthIncome
 * @param {number} rollingAvg
 * @returns {{ label: string, type: 'high'|'standard'|'lean' }}
 */
export function getIncomeBadge(currentMonthIncome, rollingAvg) {
  if (rollingAvg === 0) return { label: 'First Entry 🌱', type: 'standard' }
  const ratio = currentMonthIncome / rollingAvg
  if (ratio >= 1.1) return { label: 'High Month 🚀', type: 'high' }
  if (ratio < 0.8) return { label: 'Lean Month 💤', type: 'lean' }
  return { label: 'Standard Month', type: 'standard' }
}

/**
 * Returns last N months as 'YYYY-MM' strings, newest first
 */
export function getLastNMonths(n = 6) {
  const months = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    months.push(format(subMonths(now, i), 'yyyy-MM'))
  }
  return months
}

/**
 * Format currency
 */
export function formatCurrency(amount, currency = '€') {
  const num = Number(amount) || 0
  return `${currency}${num.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}
