import { useState } from 'react'
import { format } from 'date-fns'
import { PlusCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'
import { getCategoryById, CATEGORIES } from '../utils/categories'
import { formatCurrency } from '../utils/calculations'
import { getTip } from '../utils/motivational'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import Modal from '../components/ui/Modal'

export default function Dashboard() {
  const {
    settings, points, currency, currentMonth,
    thisMonthIncome, thisMonthExpenses, thisMonthBudget,
    rollingAvg, incomeBadge, budgetHealth, streakDays,
    addExpense, addIncome,
  } = useBudget()

  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [expForm, setExpForm] = useState({ amount: '', category: 'food', description: '', date: format(new Date(), 'yyyy-MM-dd') })
  const [incForm, setIncForm] = useState({ amount: '', description: 'Commission payment', date: format(new Date(), 'yyyy-MM-dd') })

  const totalBudgeted = thisMonthBudget
    ? Object.values(thisMonthBudget.categories || {}).reduce((a, b) => a + Number(b), 0)
    : 0
  const budgetPct = totalBudgeted ? Math.min(100, (thisMonthExpenses.total / totalBudgeted) * 100) : 0

  const healthColor = { safe: 'green', warning: 'amber', danger: 'red', unknown: 'indigo' }[budgetHealth]
  const healthLabel = { safe: 'On track ✓', warning: 'Watch out', danger: 'Over budget!', unknown: 'No budget set' }[budgetHealth]

  // Top categories by spend
  const topCats = Object.entries(thisMonthExpenses.byCategory || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)

  const tip = getTip({
    budgetHealth,
    daysLeft: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate(),
    isLeanMonth: incomeBadge.type === 'lean',
    firstName: settings.firstName,
    streakDays,
    points,
    biggestCategory: topCats[0]?.[0] || 'shopping',
  })

  const monthLabel = format(new Date(), 'MMMM yyyy')

  const handleAddExpense = (e) => {
    e.preventDefault()
    if (!expForm.amount || isNaN(Number(expForm.amount))) return
    addExpense({ ...expForm, amount: Number(expForm.amount) })
    setExpForm({ amount: '', category: 'food', description: '', date: format(new Date(), 'yyyy-MM-dd') })
    setShowAddExpense(false)
  }

  const handleAddIncome = (e) => {
    e.preventDefault()
    if (!incForm.amount || isNaN(Number(incForm.amount))) return
    addIncome({ ...incForm, amount: Number(incForm.amount) })
    setIncForm({ amount: '', description: 'Commission payment', date: format(new Date(), 'yyyy-MM-dd') })
    setShowAddIncome(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-4 space-y-4">

      {/* Greeting + month */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Hey {settings.firstName} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">{monthLabel}</p>
      </div>

      {/* Income card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">This month's income</p>
            <p className="text-3xl font-bold text-white mt-1">{formatCurrency(thisMonthIncome, currency)}</p>
            {rollingAvg > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">
                Avg: {formatCurrency(rollingAvg, currency)}/mo
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              incomeBadge.type === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
              incomeBadge.type === 'lean' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-700 text-slate-300'
            }`}>
              {incomeBadge.label}
            </span>
            <button
              onClick={() => setShowAddIncome(true)}
              className="text-xs text-indigo-400 font-medium"
            >
              + Add income
            </button>
          </div>
        </div>

        {rollingAvg > 0 && (
          <div className="mt-3 flex items-center gap-2">
            {incomeBadge.type === 'high' ? <TrendingUp size={14} className="text-emerald-400" /> :
             incomeBadge.type === 'lean' ? <TrendingDown size={14} className="text-amber-400" /> :
             <Minus size={14} className="text-slate-400" />}
            <span className="text-xs text-slate-400">
              {rollingAvg > 0 ? `${Math.abs(Math.round(((thisMonthIncome - rollingAvg) / rollingAvg) * 100))}% ${thisMonthIncome >= rollingAvg ? 'above' : 'below'} your average` : 'Building your average...'}
            </span>
          </div>
        )}
      </Card>

      {/* Budget health */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Monthly budget</p>
          <span className={`text-xs font-medium ${
            budgetHealth === 'safe' ? 'text-emerald-400' :
            budgetHealth === 'warning' ? 'text-amber-400' :
            budgetHealth === 'danger' ? 'text-red-400' : 'text-slate-400'
          }`}>{healthLabel}</span>
        </div>
        <div className="flex items-end gap-3 mb-3">
          <span className="text-3xl font-bold text-white">{formatCurrency(thisMonthExpenses.total, currency)}</span>
          {totalBudgeted > 0 && (
            <span className="text-slate-500 text-sm mb-1">/ {formatCurrency(totalBudgeted, currency)}</span>
          )}
        </div>
        {totalBudgeted > 0 ? (
          <ProgressBar value={budgetPct} color={healthColor} height="h-3" />
        ) : (
          <p className="text-xs text-slate-500">Go to Expenses to set a monthly budget</p>
        )}
      </Card>

      {/* Top categories */}
      {topCats.length > 0 && (
        <Card>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">Top spending</p>
          <div className="space-y-3">
            {topCats.map(([catId, amount]) => {
              const cat = getCategoryById(catId)
              const budgeted = thisMonthBudget?.categories?.[catId] || 0
              const pct = budgeted ? Math.min(100, (amount / budgeted) * 100) : 0
              return (
                <div key={catId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.emoji}</span>
                      <span className="text-sm text-slate-300">{cat.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{formatCurrency(amount, currency)}</span>
                  </div>
                  {budgeted > 0 && <ProgressBar value={pct} color="auto" height="h-1.5" />}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Tip card */}
      <Card className="bg-gradient-to-br from-indigo-900/40 to-slate-800 border border-indigo-500/20">
        <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide mb-1">💡 Tip</p>
        <p className="text-sm text-slate-300 leading-relaxed">{tip}</p>
        {streakDays >= 2 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-orange-400 text-sm">🔥</span>
            <span className="text-xs text-slate-400">{streakDays}-day logging streak</span>
          </div>
        )}
      </Card>

      {/* FAB: quick add expense */}
      <button
        onClick={() => setShowAddExpense(true)}
        className="fixed bottom-20 right-5 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center z-30 active:scale-95 transition-all"
      >
        <PlusCircle size={26} />
      </button>

      {/* Add Expense Modal */}
      <Modal open={showAddExpense} onClose={() => setShowAddExpense(false)} title="Add Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Amount (€)</label>
            <input
              type="number" inputMode="decimal" step="0.01"
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
              value={expForm.amount}
              onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))}
              autoFocus
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button type="button" key={cat.id}
                  onClick={() => setExpForm(f => ({ ...f, category: cat.id }))}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all ${
                    expForm.category === cat.id ? 'border-indigo-500 bg-indigo-500/15' : 'border-slate-700 bg-slate-800'
                  }`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-[10px] text-slate-400 leading-tight text-center">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Note (optional)</label>
            <input
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="What was this for?"
              value={expForm.description}
              onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Date</label>
            <input type="date"
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={expForm.date}
              onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <button type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl py-4 mt-2"
          >
            Log Expense +10 pts
          </button>
        </form>
      </Modal>

      {/* Add Income Modal */}
      <Modal open={showAddIncome} onClose={() => setShowAddIncome(false)} title="Add Income">
        <form onSubmit={handleAddIncome} className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Amount (€)</label>
            <input
              type="number" inputMode="decimal" step="0.01"
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
              value={incForm.amount}
              onChange={e => setIncForm(f => ({ ...f, amount: e.target.value }))}
              autoFocus
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Description</label>
            <input
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Commission, bonus, etc."
              value={incForm.description}
              onChange={e => setIncForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Date</label>
            <input type="date"
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={incForm.date}
              onChange={e => setIncForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <button type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl py-4 mt-2"
          >
            Log Income +5 pts
          </button>
        </form>
      </Modal>

    </div>
  )
}
