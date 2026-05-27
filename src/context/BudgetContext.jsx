import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { format, subMonths } from 'date-fns'
import { getRollingAverage, getMonthlyTotals, getBudgetHealth, getIncomeBadge, getLastNMonths } from '../utils/calculations'

const BudgetContext = createContext(null)

const KEYS = {
  income: 'bb_income',
  expenses: 'bb_expenses',
  goals: 'bb_goals',
  budgets: 'bb_budgets',
  settings: 'bb_settings',
  points: 'bb_points',
}

const DEFAULT_SETTINGS = {
  firstName: '',
  currency: '€',
  onboarded: false,
  selectedCategories: [],
  avgIncome: 0,
}

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function BudgetProvider({ children }) {
  const [income, setIncome] = useState(() => load(KEYS.income, []))
  const [expenses, setExpenses] = useState(() => load(KEYS.expenses, []))
  const [goals, setGoals] = useState(() => load(KEYS.goals, []))
  const [budgets, setBudgets] = useState(() => load(KEYS.budgets, []))
  const [settings, setSettings] = useState(() => load(KEYS.settings, DEFAULT_SETTINGS))
  const [points, setPoints] = useState(() => load(KEYS.points, 0))

  // Persist on every change
  useEffect(() => { save(KEYS.income, income) }, [income])
  useEffect(() => { save(KEYS.expenses, expenses) }, [expenses])
  useEffect(() => { save(KEYS.goals, goals) }, [goals])
  useEffect(() => { save(KEYS.budgets, budgets) }, [budgets])
  useEffect(() => { save(KEYS.settings, settings) }, [settings])
  useEffect(() => { save(KEYS.points, points) }, [points])

  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), [])

  const rollingAvg = useMemo(() => getRollingAverage(income, 3), [income])

  const thisMonthIncome = useMemo(
    () => income.filter(e => e.month === currentMonth).reduce((s, e) => s + Number(e.amount), 0),
    [income, currentMonth]
  )

  const thisMonthExpenses = useMemo(
    () => getMonthlyTotals(expenses, currentMonth),
    [expenses, currentMonth]
  )

  const thisMonthBudget = useMemo(
    () => budgets.find(b => b.month === currentMonth) || null,
    [budgets, currentMonth]
  )

  const incomeBadge = useMemo(
    () => getIncomeBadge(thisMonthIncome, rollingAvg),
    [thisMonthIncome, rollingAvg]
  )

  const budgetHealth = useMemo(() => {
    const totalBudgeted = thisMonthBudget
      ? Object.values(thisMonthBudget.categories || {}).reduce((a, b) => a + Number(b), 0)
      : 0
    return getBudgetHealth(thisMonthExpenses.total, totalBudgeted)
  }, [thisMonthExpenses, thisMonthBudget])

  const streakDays = useMemo(() => {
    if (expenses.length === 0) return 0
    const today = format(new Date(), 'yyyy-MM-dd')
    const days = new Set(expenses.map(e => e.date))
    let streak = 0
    let check = new Date()
    while (days.has(format(check, 'yyyy-MM-dd'))) {
      streak++
      check = subMonths(check, 0) // keep same
      check.setDate(check.getDate() - 1)
    }
    return streak
  }, [expenses])

  // ── Income actions ──────────────────────────────────────────────
  const addIncome = useCallback((entry) => {
    const month = entry.month || entry.date?.slice(0, 7) || currentMonth
    const newEntry = { id: uid(), ...entry, month, amount: Number(entry.amount) }
    setIncome(prev => [newEntry, ...prev])
    setPoints(p => p + 5)
  }, [currentMonth])

  const removeIncome = useCallback((id) => {
    setIncome(prev => prev.filter(e => e.id !== id))
  }, [])

  // ── Expense actions ─────────────────────────────────────────────
  const addExpense = useCallback((entry) => {
    const month = entry.month || entry.date?.slice(0, 7) || currentMonth
    const newEntry = { id: uid(), ...entry, month, amount: Number(entry.amount) }
    setExpenses(prev => [newEntry, ...prev])
    setPoints(p => p + 10)
  }, [currentMonth])

  const removeExpense = useCallback((id) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }, [])

  // ── Goal actions ────────────────────────────────────────────────
  const upsertGoal = useCallback((goal) => {
    setGoals(prev => {
      const idx = prev.findIndex(g => g.id === goal.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], ...goal }
        return updated
      }
      return [...prev, { id: uid(), ...goal }]
    })
  }, [])

  const removeGoal = useCallback((id) => {
    setGoals(prev => prev.filter(g => g.id !== id))
  }, [])

  const addToGoal = useCallback((id, amount) => {
    setGoals(prev => {
      const updated = prev.map(g => {
        if (g.id !== id) return g
        const newAmount = Math.min(Number(g.currentAmount) + Number(amount), Number(g.targetAmount))
        const updatedGoal = { ...g, currentAmount: newAmount }
        // Check milestones
        const pct = (newAmount / g.targetAmount) * 100
        updatedGoal.milestones = (g.milestones || []).map(m => ({
          ...m,
          reached: m.reached || newAmount >= m.amount,
        }))
        return updatedGoal
      })
      return updated
    })
    setPoints(p => p + 20)
  }, [])

  // ── Budget actions ──────────────────────────────────────────────
  const upsertBudget = useCallback((month, categories) => {
    setBudgets(prev => {
      const idx = prev.findIndex(b => b.month === month)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], categories }
        return updated
      }
      return [...prev, { month, categories }]
    })
  }, [])

  // ── Settings ────────────────────────────────────────────────────
  const updateSettings = useCallback((partial) => {
    setSettings(prev => ({ ...prev, ...partial }))
  }, [])

  const completeOnboarding = useCallback((data) => {
    setSettings(prev => ({ ...prev, ...data, onboarded: true }))
    if (data.sampleData) {
      const { income: si, expenses: se, savingsGoals: sg, monthlyBudgets: sb } = data.sampleData
      setIncome(si)
      setExpenses(se)
      setGoals(sg)
      setBudgets(sb)
      setPoints(150)
    }
  }, [])

  const addPoints = useCallback((n) => setPoints(p => p + n), [])

  const value = {
    // State
    income, expenses, goals, budgets, settings, points,
    // Derived
    currentMonth, rollingAvg, thisMonthIncome, thisMonthExpenses,
    thisMonthBudget, incomeBadge, budgetHealth, streakDays,
    currency: settings.currency || '€',
    // Actions
    addIncome, removeIncome,
    addExpense, removeExpense,
    upsertGoal, removeGoal, addToGoal,
    upsertBudget,
    updateSettings, completeOnboarding,
    addPoints,
  }

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
}

export function useBudget() {
  const ctx = useContext(BudgetContext)
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider')
  return ctx
}
