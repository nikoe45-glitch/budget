import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { PlusCircle, Trash2, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'
import { formatCurrency, getLastNMonths } from '../utils/calculations'
import { getLeanModeSuggestions } from '../utils/motivational'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'

const MONTH_LABELS = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' }

export default function Income() {
  const { income, addIncome, removeIncome, currentMonth, rollingAvg, incomeBadge, currency } = useBudget()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ amount: '', description: 'Commission payment', date: format(new Date(), 'yyyy-MM-dd') })
  const [showLeanTips, setShowLeanTips] = useState(false)

  const last6 = getLastNMonths(6).reverse()

  const chartData = last6.map(m => {
    const total = income.filter(e => e.month === m).reduce((s, e) => s + Number(e.amount), 0)
    const [yr, mo] = m.split('-')
    return { month: MONTH_LABELS[mo], total, key: m }
  })

  const thisMonthIncome = income.filter(e => e.month === currentMonth).reduce((s, e) => s + Number(e.amount), 0)
  const thisMonthEntries = income.filter(e => e.month === currentMonth).sort((a, b) => b.date.localeCompare(a.date))
  const leanSuggestions = getLeanModeSuggestions(rollingAvg, thisMonthIncome)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.amount || isNaN(Number(form.amount))) return
    addIncome({ ...form, amount: Number(form.amount) })
    setForm({ amount: '', description: 'Commission payment', date: format(new Date(), 'yyyy-MM-dd') })
    setShowModal(false)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-slate-700 rounded-xl px-3 py-2 text-sm">
          <p className="text-slate-300">{label}</p>
          <p className="text-white font-semibold">{formatCurrency(payload[0].value, currency)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-4 space-y-4">

      {/* This month summary */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">
          {format(new Date(), 'MMMM yyyy')}
        </p>
        <p className="text-4xl font-bold text-white mb-2">{formatCurrency(thisMonthIncome, currency)}</p>
        <div className="flex items-center gap-2">
          <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${
            incomeBadge.type === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
            incomeBadge.type === 'lean' ? 'bg-amber-500/20 text-amber-400' :
            'bg-slate-700 text-slate-300'
          }`}>{incomeBadge.label}</span>
          {rollingAvg > 0 && (
            <span className="text-xs text-slate-500">3-mo avg: {formatCurrency(rollingAvg, currency)}</span>
          )}
        </div>
      </Card>

      {/* Lean Mode alert */}
      {incomeBadge.type === 'lean' && (
        <Card className="border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start justify-between">
            <div className="flex gap-2">
              <span className="text-xl">💤</span>
              <div>
                <p className="font-semibold text-amber-400 text-sm">Lean Month Detected</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your income is {Math.round(((rollingAvg - thisMonthIncome) / rollingAvg) * 100)}% below your average. Here's how to cover the gap:
                </p>
              </div>
            </div>
            <button onClick={() => setShowLeanTips(v => !v)} className="text-slate-500">
              <Info size={16} />
            </button>
          </div>
          {showLeanTips && (
            <ul className="mt-3 space-y-1.5">
              {leanSuggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-amber-500 mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Chart */}
      <Card>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-4">Last 6 months</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
            {rollingAvg > 0 && (
              <ReferenceLine y={rollingAvg} stroke="#6366f1" strokeDasharray="4 4" />
            )}
            <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
        {rollingAvg > 0 && (
          <p className="text-xs text-slate-500 text-center mt-1">
            — dashed line = 3-month average ({formatCurrency(rollingAvg, currency)})
          </p>
        )}
      </Card>

      {/* Income entries */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">This Month's Entries</p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-indigo-400 text-sm font-medium"
          >
            <PlusCircle size={15} /> Add
          </button>
        </div>
        {thisMonthEntries.length === 0 ? (
          <Card>
            <p className="text-slate-500 text-sm text-center py-4">No income logged this month yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {thisMonthEntries.map(entry => (
              <Card key={entry.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <TrendingUp size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{entry.description || 'Income'}</p>
                    <p className="text-slate-500 text-xs">{entry.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-semibold">+{formatCurrency(entry.amount, currency)}</span>
                  <button onClick={() => removeIncome(entry.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Income Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Income">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Amount (€)</label>
            <input
              type="number" inputMode="decimal" step="0.01"
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              autoFocus
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Description</label>
            <input
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Date</label>
            <input type="date"
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <button type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl py-4"
          >
            Log Income +5 pts
          </button>
        </form>
      </Modal>
    </div>
  )
}
