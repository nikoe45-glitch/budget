import { format, subMonths, subDays } from 'date-fns'

export function generateSampleData() {
  const now = new Date()
  const income = []
  const expenses = []

  // Generate 4 months of sample data
  for (let m = 3; m >= 0; m--) {
    const monthDate = subMonths(now, m)
    const month = format(monthDate, 'yyyy-MM')
    const baseIncome = 2800 + (Math.random() - 0.4) * 1200

    income.push({
      id: `inc-${month}-1`,
      date: `${month}-05`,
      amount: Math.round(baseIncome),
      description: 'Commission payment',
      month,
    })

    if (Math.random() > 0.5) {
      income.push({
        id: `inc-${month}-2`,
        date: `${month}-20`,
        amount: Math.round(300 + Math.random() * 400),
        description: 'Bonus / extra',
        month,
      })
    }

    // Sample expenses for this month
    const sampleExpenses = [
      { category: 'bills', amount: 850, description: 'Rent', day: 1 },
      { category: 'groceries', amount: 65, description: 'Supermarket', day: 3 },
      { category: 'food', amount: 22, description: 'Lunch', day: 5 },
      { category: 'transport', amount: 49, description: 'Monthly pass', day: 1 },
      { category: 'groceries', amount: 78, description: 'Weekly shop', day: 8 },
      { category: 'entertainment', amount: 14.99, description: 'Netflix', day: 7 },
      { category: 'entertainment', amount: 9.99, description: 'Spotify', day: 7 },
      { category: 'food', amount: 35, description: 'Dinner out', day: 10 },
      { category: 'health', amount: 28, description: 'Pharmacy', day: 12 },
      { category: 'shopping', amount: 45, description: 'Clothes', day: 14 },
      { category: 'groceries', amount: 55, description: 'Supermarket', day: 16 },
      { category: 'food', amount: 18, description: 'Coffee & snacks', day: 17 },
      { category: 'fitness', amount: 30, description: 'Gym', day: 1 },
      { category: 'food', amount: 42, description: 'Weekend brunch', day: 19 },
      { category: 'shopping', amount: 29, description: 'Online order', day: 21 },
      { category: 'groceries', amount: 70, description: 'Big shop', day: 23 },
      { category: 'food', amount: 25, description: 'Takeaway', day: 25 },
      { category: 'entertainment', amount: 40, description: 'Cinema & drinks', day: 26 },
      { category: 'transport', amount: 15, description: 'Taxi', day: 27 },
      { category: 'food', amount: 55, description: 'Month-end dinner', day: 28 },
    ]

    sampleExpenses.forEach((e, i) => {
      const day = String(e.day).padStart(2, '0')
      expenses.push({
        id: `exp-${month}-${i}`,
        date: `${month}-${day}`,
        amount: e.amount + (Math.random() - 0.5) * 5,
        category: e.category,
        description: e.description,
        month,
      })
    })
  }

  const savingsGoals = [
    {
      id: 'goal-1',
      title: 'Emergency Fund',
      targetAmount: 3000,
      currentAmount: 950,
      targetDate: format(subMonths(now, -6), 'yyyy-MM-dd'),
      color: '#10b981',
      milestones: [
        { label: '€750 — 1 Month', amount: 750, reached: true },
        { label: '€1500 — 2 Months', amount: 1500, reached: false },
        { label: '€3000 — Full Fund', amount: 3000, reached: false },
      ],
    },
    {
      id: 'goal-2',
      title: 'Holiday in Portugal',
      targetAmount: 1500,
      currentAmount: 420,
      targetDate: format(subMonths(now, -4), 'yyyy-MM-dd'),
      color: '#6366f1',
      milestones: [
        { label: 'Flights €300', amount: 300, reached: true },
        { label: 'Hotel €800', amount: 800, reached: false },
        { label: 'Full Trip', amount: 1500, reached: false },
      ],
    },
  ]

  const monthlyBudgets = []
  for (let m = 3; m >= 0; m--) {
    const monthDate = subMonths(now, m)
    const month = format(monthDate, 'yyyy-MM')
    monthlyBudgets.push({
      month,
      categories: {
        groceries: 250,
        food: 180,
        transport: 80,
        health: 60,
        shopping: 100,
        entertainment: 80,
        bills: 900,
        fitness: 40,
        learning: 30,
        travel: 50,
        pets: 0,
        gifts: 40,
        other: 80,
      },
    })
  }

  return { income, expenses, savingsGoals, monthlyBudgets }
}
