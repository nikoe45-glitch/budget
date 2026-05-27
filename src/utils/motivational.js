/**
 * Returns an ADHD-friendly motivational tip based on context
 * @param {Object} context
 * @param {string} context.budgetHealth - 'safe'|'warning'|'danger'|'unknown'
 * @param {number} context.daysLeft - days left in month
 * @param {number} context.savedThisMonth - amount saved/remaining
 * @param {string} context.biggestCategory - biggest spending category label
 * @param {number} context.points - current points
 * @param {number} context.streakDays - consecutive logging days
 * @param {boolean} context.isLeanMonth - whether income is below avg
 * @param {string} context.firstName - user's first name
 * @returns {string} tip text
 */
export function getTip(context = {}) {
  const {
    budgetHealth = 'unknown',
    daysLeft = 15,
    savedThisMonth = 0,
    biggestCategory = 'Shopping',
    points = 0,
    streakDays = 0,
    isLeanMonth = false,
    firstName = ''
  } = context

  const tips = []

  // Points milestone tips
  if (points > 0 && points % 100 < 20) {
    tips.push(`⚡ ${points} points earned! Keep logging to reach the next level!`)
  }

  // Streak tips
  if (streakDays >= 5) {
    tips.push(`🎯 ${streakDays}-day logging streak — you're building a great habit!`)
  } else if (streakDays >= 3) {
    tips.push(`🔥 ${streakDays} days in a row! Keep the streak alive!`)
  }

  // Budget health tips
  if (budgetHealth === 'danger') {
    tips.push(`🚨 Budget nearly full! ${daysLeft} days left — time to hit the brakes on ${biggestCategory}.`)
    tips.push(`⚠️ You're over 90% through your budget. Try a "no-spend" day tomorrow!`)
  } else if (budgetHealth === 'warning') {
    tips.push(`You're 80% through budget with ${daysLeft} days left — slow down on ${biggestCategory}!`)
    tips.push(`🟡 Getting close to your limit. Can you skip one ${biggestCategory} purchase this week?`)
  } else if (budgetHealth === 'safe') {
    tips.push(`✅ Budget looking healthy! You've got room to breathe this month.`)
    tips.push(`💪 Great spending control${firstName ? ', ' + firstName : ''}! Keep it up.`)
  }

  // Lean month tips
  if (isLeanMonth) {
    tips.push(`💡 Low income month detected. Lean Mode: skip €10 daily = €${10 * (daysLeft || 15)} saved!`)
    tips.push(`📉 Lean month — focus on needs over wants. Your future self will thank you!`)
    tips.push(`🧘 This is a lean month. Pause any non-essential subscriptions for 30 days.`)
  }

  // Days left tips
  if (daysLeft <= 5) {
    tips.push(`📅 Only ${daysLeft} days left in the month — finish strong!`)
  } else if (daysLeft >= 25) {
    tips.push(`🌱 Fresh start! Set your intentions for the month ahead.`)
  }

  // Savings tips
  if (savedThisMonth > 0) {
    tips.push(`🎉 You've saved €${savedThisMonth.toFixed(0)} so far this month — amazing!`)
  }

  // General ADHD-friendly tips
  const generalTips = [
    `💡 Tip: Review last week's expenses every Sunday — 5 minutes keeps you on track.`,
    `🧠 ADHD hack: Pay yourself first — auto-transfer to savings on payday.`,
    `📱 Log expenses the moment you spend — future you will appreciate it!`,
    `🎯 One goal at a time. What's the ONE thing you're saving for this month?`,
    `⏰ Set a weekly budget check reminder — consistency beats perfection.`,
    `🛒 Grocery tip: Shop with a list and never hungry — saves 20-30%!`,
  ]

  tips.push(...generalTips)

  // Pick a tip based on time-of-day seeding for consistency
  const seed = new Date().getHours() + new Date().getDate()
  return tips[seed % tips.length] || generalTips[0]
}

/**
 * Returns lean mode budget cutting suggestions
 * @param {number} rollingAvg
 * @param {number} currentIncome
 * @returns {string[]}
 */
export function getLeanModeSuggestions(rollingAvg, currentIncome) {
  const gap = Math.max(0, rollingAvg - currentIncome)
  return [
    `Skip takeaways this month → save ~€40–60`,
    `Pause unused subscriptions → ~€20–40/month`,
    `Cook at home 5 days/week → ~€60 savings`,
    `Postpone non-essential shopping → ~€50–100`,
    `Gap to cover: ~€${Math.round(gap)} — small daily cuts add up fast!`,
  ]
}

/**
 * Returns a motivational message for goal progress
 * @param {number} percent - 0 to 100
 * @param {string} title - goal title
 * @returns {string}
 */
export function getGoalMessage(percent, title) {
  if (percent >= 100) return `🏆 Goal achieved! "${title}" — you crushed it!`
  if (percent >= 75) return `🌟 So close! Just ${100 - percent}% to go on "${title}"!`
  if (percent >= 50) return `🌗 Halfway there on "${title}" — momentum is building!`
  if (percent >= 25) return `🌱 Great start on "${title}" — every euro counts!`
  return `💪 Journey of a thousand miles starts with one step. You've got this!`
}
