import { useState, useMemo } from 'react'
import { format, subMonths } from 'date-fns'
import { PlusCircle, Trash2, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'
import { getCategoryById, CATEGORIES } from '../utils/categories'
import { formatCurrency, getMonthlyTotals, getBudgetHealth, getLastNMonths } from '../utils/calculations'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import Modal from '../components/ui/Modal'

const MONTH_LABELS = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' }

export default function Expenses() {
  const { expenses, addExpense, removeExpense, budgets, upsertBudget, currentMonth, currency, settings } = useBudget()

  const months = getLastNMonths(4)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [filterCat, setFilterCat] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [expForm, setExpForm] = useState({ amount: '', category: 'food', description: '', date: format(new Date(), 'yyyy-MM-dd') })
  const [budgetForm, setBudgetForm] = useState({})

  const monthBudget = budgets.find(b => b.month === selectedMonth)
  const { total, byCategory } = useMemo(() => getMonthlyTotals(expenses, selectedMonth), [expenses, selectedMonth])
  const totalBudgeted = monthBudget ? Object.values(monthBudget.categories || {}).reduce((a, b) => a + Number(b), 0) : 0
  const budgetPct = totalBudgeted ? Math.min(100, (total / totalBudgeted) * 100) : 0
  const health = getBudgetHealth(total, totalBudgeted)

  // Filter and group expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => e.month === selectedMonth && (filterCat === 'all' || e.category === filterCat))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [expenses, selectedMonth, filterCat])

  const grouped = useMemo(() => {
    const groups = {}
    filteredExpenses.forEach(e => {
      if (!groups[e.date]) groups[e.date] = []
      groups[e.date].push(e)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredExpenses])

  // Used categories
  const usedCats = useMemo(() => {
    const used = new Set(expenses.filter(e => e.month === selectedMonth).map(e => e.category))
    return CATEGORIES.filter(c => used.has(c.id) || c.id === 'other')
  }, [expenses, selectedMonth])

  const handleAddExpense = (e) => {
    e.preventDefault()
    if (!expForm.amount || isNaN(Number(expForm.amount))) return
    addExpense({ ...expForm, amount: Number(expForm.amount) })
    setExpForm({ amount: '', category: 'food', description: '', date: format(new Date(), 'yyyy-MM-dd') })
    setShowAddModal(false)
  }

  const openBudgetModal = () => {
    const existing = monthBudget?.categories || {}
    const init = {}
    CATEGORIES.forEach(c => { init[c.id] = existing[c.id] ?? (settings.selectedCategories?.includes(c.id) ? '' : '') })
    setBudgetForm(init)
    setShowBudgetModal(true)
  }

  const handleSaveBudget = () => {
    const cleaned = {}
    Object.entries(budgetForm).forEach(([k, v]) => {
      const n = Number(v)
      if (n > 0) cleaned[k] = n
    })
    upsertBudget(selectedMonth, cleaned)
    setShowBudgetModal(false)
  }

  const healthColor = { safe: 'green', warning: 'amber', danger: 'red', unknown: 'indigo' }[health]

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-4 space-y-4">

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {months.map(m => {
          const [yr, mo] = m.split('-')
          const label = `${MONTH_LABELS[mo]} ${yr.slice(2)}`
          return (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedMonth === m
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Budget overview */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Total Spent</p>
            <p className="text-3xl font-bold text-white mt-1">{formatCurrency(total, currency)}</p>
            {totalBudgeted > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">of {formatCurrency(totalBudgeted, currency)} budget</p>
            )}
          </div>
          <button onClick={openBudgetModal} className="flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-700 rounded-xl px-3 py-2 text-xs">
            <Settings2 size={13} /> Budget
          </button>
        </div>
        {totalBudgeted > 0 && <ProgressBar value={budgetPct} color={healthColor} height="h-2.5" />}
      </Card>

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <Card>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">By Category</p>
          <div className="space-y-3">
            {Object.entries(byCategory).sort(([, a], [, b]) => b - a).map(([catId, amount]) => {
              const cat = getCategoryById(catId)
              const budgeted = monthBudget?.categories?.[catId] || 0
              const pct = budgeted ? Math.min(100, (amount / budgeted) * 100) : 0
              const catHealth = budgeted ? getBudgetHealth(amount, budgeted) : 'unknown'
              return (
                <div key={catId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span style={{ color: cat.color }} className="text-base">{cat.emoji}</span>
                      <span className="text-sm text-slate-300">{cat.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-white">{formatCurrency(amount, currency)}</span>
                      {budgeted > 0 && (
                        <span className="text-xs text-slate-500 ml-1">/ {formatCurrency(budgeted, currency)}</span>
                      )}
                    </div>
                  </div>
                  {budgeted > 0 && (
                    <ProgressBar value={pct} color={{ safe: 'green', warning: 'amber', danger: 'red', unknown: 'indigo' }[catHealth]} height="h-1.5" />
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCat('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filterCat === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          All
        </button>
        {usedCats.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
              filterCat === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Expense list */}
      <div className="space-y-4">
        {grouped.length === 0 && (
          <Card>
            <p className="text-slate-500 text-sm text-center py-6">No expenses for this period.</p>
          </Card>
        )}
        {grouped.map(([date, dayExpenses]) => (
          <div key={date}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 font-medium">
                {format(new Date(date + 'T12:00:00'), 'EEEE, d MMM')}
              </p>
              <p className="text-xs text-slate-500">
                {formatCurrency(dayExpenses.reduce((s, e) => s + Number(e.amount), 0), currency)}
              </p>
            </div>
            <div className="space-y-2">
              {dayExpenses.map(exp => {
                const cat = getCategoryById(exp.category)
                return (
                  <div key={exp.id} className="bg-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: cat.color + '22' }}>
                        {cat.emoji}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{exp.description || cat.label}</p>
                        <p className="text-slate-500 text-xs">{cat.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold text-sm">{formatCurrency(exp.amount, currency)}</span>
                      <button onClick={() => removeExpense(exp.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-20 right-5 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center z-30 active:scale-95 transition-all"
      >
        <PlusCircle size={26} />
      </button>

      {/* Add Expense Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Expense">
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
            <label className="text-slate-400 text-sm mb-1.5 block">Note</label>
            <input
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional description"
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
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl py-4"
          >
            Log Expense +10 pts
          </button>
        </form>
      </Modal>

      {/* Budget Modal */}
      <Modal open={showBudgetModal} onClose={() => setShowBudgetModal(false)} title="Set Budget">
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">Set monthly budget limits per category.</p>
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="text-xl w-7">{cat.emoji}</span>
              <span className="text-sm text-slate-300 flex-1">{cat.label}</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-sm">€</span>
                <input
                  type="number" inputMode="decimal"
                  className="w-24 bg-slate-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                  placeholder="0"
                  value={budgetForm[cat.id] || ''}
                  onChange={e => setBudgetForm(f => ({ ...f, [cat.id]: e.target.value }))}
                />
              </div>
            </div>
          ))}
          <div className="pt-2">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-slate-400">Total budget</span>
              <span className="text-white font-semibold">
                {formatCurrency(Object.values(budgetForm).reduce((s, v) => s + (Number(v) || 0), 0), currency)}
              </span>
            </div>
            <button
              onClick={handleSaveBudget}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl py-4"
            >
              Save Budget
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
