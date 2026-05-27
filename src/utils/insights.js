import { parseISO, getDay, getDate, format, subMonths } from 'date-fns'

/**
 * Detects spending patterns across months
 * @param {Array} expenses - all expenses
 * @param {number} months - how many months to analyze
 * @returns {Array} array of insight objects
 */
export function findSpendingTropes(expenses, months = 3) {
  if (!expenses || expenses.length === 0) return []

  const now = new Date()
  const cutoff = format(subMonths(now, months), 'yyyy-MM')
  const relevant = expenses.filter(e => e.month >= cutoff)

  if (relevant.length < 5) return []

  const insights = []

  // Weekend spike detection
  const weekendSpike = detectWeekendSpike(relevant)
  if (weekendSpike) insights.push(weekendSpike)

  // Month-end rush
  const monthEndRush = detectMonthEndRush(relevant)
  if (monthEndRush) insights.push(monthEndRush)

  // Category creep
  const categoryCreep = detectCategoryCreep(expenses, months)
  if (categoryCreep) insights.push(categoryCreep)

  // Impulse small purchases
  const impulseSmall = detectImpulseSmall(relevant)
  if (impulseSmall) insights.push(impulseSmall)

  // Subscription drift
  const subscriptionDrift = detectSubscriptionDrift(relevant)
  if (subscriptionDrift) insights.push(subscriptionDrift)

  return insights
}

function detectWeekendSpike(expenses) {
  let weekdayTotal = 0, weekdayCount = 0
  let weekendTotal = 0, weekendCount = 0

  expenses.forEach(exp => {
    try {
      const d = parseISO(exp.date)
      const dow = getDay(d) // 0=Sun, 6=Sat
      const isWeekend = dow === 0 || dow === 6
      if (isWeekend) {
        weekendTotal += Number(exp.amount)
        weekendCount++
      } else {
        weekdayTotal += Number(exp.amount)
        weekdayCount++
      }
    } catch {}
  })

  if (weekdayCount === 0 || weekendCount === 0) return null

  const weekdayAvg = weekdayTotal / weekdayCount
  const weekendAvg = weekendTotal / weekendCount

  if (weekendAvg > weekdayAvg * 1.3) {
    return {
      type: 'weekend_spike',
      title: 'Weekend Spending Spike',
      description: `Your weekend spending is ${Math.round((weekendAvg / weekdayAvg - 1) * 100)}% higher than weekdays. Consider setting a weekend budget.`,
      severity: weekendAvg > weekdayAvg * 1.6 ? 'warning' : 'info',
      icon: '📅',
      action: 'Set a weekend cash limit before Friday'
    }
  }
  return null
}

function detectMonthEndRush(expenses) {
  let lastFiveDaysTotal = 0, lastFiveDaysCount = 0
  let otherDaysTotal = 0, otherDaysCount = 0

  expenses.forEach(exp => {
    try {
      const d = parseISO(exp.date)
      const dom = getDate(d)
      // Approximate last 5 days (26th onwards)
      if (dom >= 26) {
        lastFiveDaysTotal += Number(exp.amount)
        lastFiveDaysCount++
      } else {
        otherDaysTotal += Number(exp.amount)
        otherDaysCount++
      }
    } catch {}
  })

  if (lastFiveDaysCount === 0 || otherDaysCount === 0) return null

  const lastFiveAvg = lastFiveDaysTotal / lastFiveDaysCount
  const otherAvg = otherDaysTotal / otherDaysCount

  if (lastFiveAvg > otherAvg * 1.4) {
    return {
      type: 'month_end_rush',
      title: 'Month-End Spending Rush',
      description: `You tend to spend ${Math.round((lastFiveAvg / otherAvg - 1) * 100)}% more in the last days of the month. This may be impulsive end-of-month spending.`,
      severity: 'warning',
      icon: '📆',
      action: 'Try "spending freeze" on 26th-31st each month'
    }
  }
  return null
}

function detectCategoryCreep(expenses, months) {
  const now = new Date()

  // Compare last month vs 2-3 months ago
  if (months < 2) return null

  const lastMonth = format(subMonths(now, 1), 'yyyy-MM')
  const prevMonth = format(subMonths(now, 2), 'yyyy-MM')

  const lastMonthByCategory = {}
  const prevMonthByCategory = {}

  expenses.forEach(exp => {
    if (exp.month === lastMonth) {
      lastMonthByCategory[exp.category] = (lastMonthByCategory[exp.category] || 0) + Number(exp.amount)
    }
    if (exp.month === prevMonth) {
      prevMonthByCategory[exp.category] = (prevMonthByCategory[exp.category] || 0) + Number(exp.amount)
    }
  })

  let biggestCreep = null
  let biggestGrowth = 0

  Object.keys(lastMonthByCategory).forEach(cat => {
    const current = lastMonthByCategory[cat]
    const prev = prevMonthByCategory[cat] || 0
    if (prev > 0 && current > prev) {
      const growth = (current - prev) / prev
      if (growth > 0.3 && growth > biggestGrowth) {
        biggestGrowth = growth
        biggestCreep = { cat, current, prev, growth }
      }
    }
  })

  if (biggestCreep) {
    const { cat, growth } = biggestCreep
    const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1)
    return {
      type: 'category_creep',
      title: `${catLabel} Spending Creeping Up`,
      description: `Your ${catLabel.toLowerCase()} spending grew ${Math.round(growth * 100)}% last month. Small increases can add up fast.`,
      severity: growth > 0.5 ? 'danger' : 'warning',
      icon: '📈',
      action: `Set a firm budget for ${catLabel.toLowerCase()} this month`
    }
  }
  return null
}

function detectImpulseSmall(expenses) {
  const smallTransactions = expenses.filter(e => Number(e.amount) < 10)
  if (smallTransactions.length < 5) return null

  const smallTotal = smallTransactions.reduce((s, e) => s + Number(e.amount), 0)
  const totalAll = expenses.reduce((s, e) => s + Number(e.amount), 0)

  if (smallTransactions.length >= 10 || (smallTotal / totalAll) > 0.15) {
    return {
      type: 'impulse_small',
      title: 'Small Purchase Accumulation',
      description: `${smallTransactions.length} transactions under €10 add up to €${smallTotal.toFixed(2)}. These small impulse buys are sneaky!`,
      severity: smallTransactions.length >= 20 ? 'warning' : 'info',
      icon: '🪙',
      action: 'Apply a 5-minute rule: wait before any sub-€10 purchase'
    }
  }
  return null
}

function detectSubscriptionDrift(expenses) {
  // Look for same-amount transactions across months
  const amountMonthMap = {}

  expenses.forEach(exp => {
    const amt = Number(exp.amount).toFixed(2)
    if (!amountMonthMap[amt]) amountMonthMap[amt] = new Set()
    amountMonthMap[amt].add(exp.month)
  })

  const recurring = Object.entries(amountMonthMap)
    .filter(([, months]) => months.size >= 2)
    .map(([amount]) => Number(amount))
    .filter(a => a > 1 && a < 200)

  if (recurring.length >= 3) {
    const totalMonthly = recurring.reduce((a, b) => a + b, 0)
    return {
      type: 'subscription_drift',
      title: 'Subscription Drift Detected',
      description: `You have ${recurring.length} recurring charges totaling ~€${totalMonthly.toFixed(2)}/month. Are you using all of them?`,
      severity: totalMonthly > 50 ? 'warning' : 'info',
      icon: '🔄',
      action: 'Audit your subscriptions — cancel anything unused'
    }
  }
  return null
}
