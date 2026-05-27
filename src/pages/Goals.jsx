import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { PlusCircle, Trash2, Plus, Trophy, Target } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'
import { formatCurrency } from '../utils/calculations'
import { getGoalMessage } from '../utils/motivational'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'

const GOAL_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6', '#f97316', '#8b5cf6'
]

function GoalCard({ goal, currency }) {
  const { addToGoal, removeGoal } = useBudget()
  const [showAdd, setShowAdd] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
  const remaining = goal.targetAmount - goal.currentAmount
  const message = getGoalMessage(pct, goal.title)

  const handleAdd = () => {
    const n = Number(addAmount)
    if (!n || n <= 0) return
    addToGoal(goal.id, n)
    setAddAmount('')
    setShowAdd(false)
  }

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: goal.color + '22' }}>
            <Target size={18} style={{ color: goal.color }} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">{goal.title}</h3>
            {goal.targetDate && (
              <p className="text-xs text-slate-500 mt-0.5">
                By {format(parseISO(goal.targetDate), 'd MMM yyyy')}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => setShowConfirmDelete(true)} className="text-slate-600 hover:text-red-400 p-1">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Amounts */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-white">{formatCurrency(goal.currentAmount, currency)}</p>
          <p className="text-xs text-slate-500">of {formatCurrency(goal.targetAmount, currency)}</p>
        </div>
        <p className="text-sm text-slate-400">{Math.round(pct)}%</p>
      </div>

      {/* Progress bar with milestone dots */}
      <div className="relative">
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(to right, ${goal.color}99, ${goal.color})`,
            }}
          />
        </div>
        {/* Milestone dots */}
        {(goal.milestones || []).map((m, i) => {
          const dotPct = (m.amount / goal.targetAmount) * 100
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                left: `calc(${dotPct}% - 8px)`,
                borderColor: m.reached ? goal.color : '#475569',
                backgroundColor: m.reached ? goal.color : '#1e293b',
              }}
            >
              {m.reached && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
          )
        })}
      </div>

      {/* Milestone labels */}
      {(goal.milestones || []).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {goal.milestones.map((m, i) => (
            <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${
              m.reached
                ? 'text-white font-medium'
                : 'text-slate-500 bg-slate-700/50'
            }`} style={m.reached ? { backgroundColor: goal.color + '33', color: goal.color } : {}}>
              {m.reached ? '✓ ' : ''}{m.label}
            </span>
          ))}
        </div>
      )}

      {/* Message */}
      <p className="text-xs text-slate-400 italic">{message}</p>

      {/* Add funds */}
      {pct < 100 && (
        <div>
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full py-2.5 rounded-xl border border-dashed text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              style={{ borderColor: goal.color + '60', color: goal.color }}
            >
              <Plus size={15} /> Add funds
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="number" inputMode="decimal"
                className="flex-1 bg-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="€ amount"
                value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2.5 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: goal.color }}
              >
                Add
              </button>
              <button onClick={() => setShowAdd(false)} className="px-3 py-2.5 rounded-xl bg-slate-700 text-slate-400 text-sm">
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {pct >= 100 && (
        <div className="bg-amber-500/10 rounded-xl p-3 flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" />
          <p className="text-sm text-amber-300 font-medium">Goal achieved! 🎉</p>
        </div>
      )}

      {/* Delete confirm */}
      {showConfirmDelete && (
        <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
          <p className="text-sm text-red-400 mb-2">Delete this goal?</p>
          <div className="flex gap-2">
            <button onClick={() => removeGoal(goal.id)} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium">Delete</button>
            <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function Goals() {
  const { goals, upsertGoal, currency } = useBudget()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    title: '', targetAmount: '', targetDate: '', color: GOAL_COLORS[0],
    milestones: [
      { label: '', amount: '' },
      { label: '', amount: '' },
    ]
  })

  const totalSaved = goals.reduce((s, g) => s + Number(g.currentAmount), 0)
  const totalTarget = goals.reduce((s, g) => s + Number(g.targetAmount), 0)
  const overallPct = totalTarget ? Math.min(100, (totalSaved / totalTarget) * 100) : 0

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.targetAmount) return
    const milestones = form.milestones
      .filter(m => m.label.trim() && m.amount)
      .map(m => ({ ...m, amount: Number(m.amount), reached: false }))

    // Auto-add 25/50/75% milestones if none set
    const target = Number(form.targetAmount)
    const finalMilestones = milestones.length > 0 ? milestones : [
      { label: '25%', amount: target * 0.25, reached: false },
      { label: '50%', amount: target * 0.5, reached: false },
      { label: '75%', amount: target * 0.75, reached: false },
    ]

    upsertGoal({
      title: form.title.trim(),
      targetAmount: target,
      currentAmount: 0,
      targetDate: form.targetDate,
      color: form.color,
      milestones: finalMilestones,
    })
    setForm({ title: '', targetAmount: '', targetDate: '', color: GOAL_COLORS[0], milestones: [{ label:'',amount:''},{label:'',amount:''}] })
    setShowModal(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-4 space-y-4">

      {/* Overall progress */}
      {goals.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-900/30 to-slate-800">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">All goals</p>
          <div className="flex items-end justify-between mb-3">
            <p className="text-2xl font-bold text-white">{formatCurrency(totalSaved, currency)}</p>
            <p className="text-slate-400 text-sm">of {formatCurrency(totalTarget, currency)}</p>
          </div>
          <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">{Math.round(overallPct)}% to all targets</p>
        </Card>
      )}

      {/* Goals */}
      {goals.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-white font-semibold mb-1">No goals yet</p>
            <p className="text-slate-400 text-sm">Set your first savings goal and start tracking!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => <GoalCard key={goal.id} goal={goal} currency={currency} />)}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-5 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center z-30 active:scale-95 transition-all"
      >
        <PlusCircle size={26} />
      </button>

      {/* New Goal Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Goal">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Goal name</label>
            <input
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Emergency fund, Holiday..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Target amount (€)</label>
            <input
              type="number" inputMode="decimal"
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0"
              value={form.targetAmount}
              onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Target date (optional)</label>
            <input type="date"
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.targetDate}
              onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map(c => (
                <button type="button" key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Milestones (optional)</label>
            <p className="text-xs text-slate-500 mb-2">Leave blank for auto 25/50/75% milestones</p>
            {form.milestones.map((m, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  className="flex-1 bg-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                  placeholder="Label (e.g. Flights booked)"
                  value={m.label}
                  onChange={e => setForm(f => {
                    const ms = [...f.milestones]; ms[i] = { ...ms[i], label: e.target.value }; return { ...f, milestones: ms }
                  })}
                />
                <input
                  type="number"
                  className="w-24 bg-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                  placeholder="€"
                  value={m.amount}
                  onChange={e => setForm(f => {
                    const ms = [...f.milestones]; ms[i] = { ...ms[i], amount: e.target.value }; return { ...f, milestones: ms }
                  })}
                />
              </div>
            ))}
          </div>
          <button type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl py-4"
          >
            Create Goal 🎯
          </button>
        </form>
      </Modal>
    </div>
  )
}
