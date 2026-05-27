import { useMemo } from 'react'
import { format, subMonths } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { useBudget } from '../context/BudgetContext'
import { findSpendingTropes } from '../utils/insights'
import { getCategoryById, CATEGORIES } from '../utils/categories'
import { formatCurrency, getLastNMonths, getMonthlyTotals } from '../utils/calculations'
import Card from '../components/ui/Card'

const MONTH_LABELS = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' }

const severityStyles = {
  danger: 'border-red-500/30 bg-red-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  info: 'border-blue-500/30 bg-blue-500/5',
}
const severityLabel = {
  danger: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
}

export default function Insights() {
  const { income, expenses, currency } = useBudget()

  // Determine if we have enough data (2+ months)
  const monthsWithData = useMemo(() => {
    const months = new Set(expenses.map(e => e.month))
    return months.size
  }, [expenses])

  const last6 = getLastNMonths(6).reverse()

  const chartData = useMemo(() => last6.map(m => {
    const inc = income.filter(e => e.month === m).reduce((s, e) => s + Number(e.amount), 0)
    const exp = expenses.filter(e => e.month === m).reduce((s, e) => s + Number(e.amount), 0)
    const [yr, mo] = m.split('-')
    return { month: MONTH_LABELS[mo], income: inc, expenses: exp, key: m }
  }), [income, expenses, last6])

  const tropes = useMemo(() => findSpendingTropes(expenses), [expenses])

  // Category trends (last 3 months)
  const catTrends = useMemo(() => {
    const last3 = getLastNMonths(3).reverse()
    return CATEGORIES.map(cat => {
      const data = last3.map(m => ({
        month: MONTH_LABELS[m.split('-')[1]],
        amount: expenses.filter(e => e.month === m && e.category === cat.id).reduce((s, e) => s + Number(e.amount), 0)
      }))
      const total = data.reduce((s, d) => s + d.amount, 0)
      return { ...cat, data, total }
    }).filter(c => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [expenses])

  // Biggest splurge
  const biggestExpense = useMemo(() => {
    return [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0]
  }, [expenses])

  // Avg income vs expenses
  const nonZeroMonths = chartData.filter(d => d.income > 0 || d.expenses > 0)
  const avgIncome = nonZeroMonths.length ? nonZeroMonths.reduce((s, d) => s + d.income, 0) / nonZeroMonths.length : 0
  const avgExpenses = nonZeroMonths.length ? nonZeroMonths.reduce((s, d) => s + d.expenses, 0) / nonZeroMonths.length : 0

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-slate-700 rounded-xl px-3 py-2 text-xs space-y-1">
          <p className="text-slate-300 font-medium">{label}</p>
          {payload.map(p => (
            <p key={p.dataKey} style={{ color: p.color }}>
              {p.name}: {formatCurrency(p.value, currency)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (monthsWithData < 2) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">Insights unlock soon!</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Keep logging your income and expenses. After 2 full months of data, you'll get personalized spending pattern analysis here.
          </p>
          <div className="mt-6 bg-slate-700 rounded-full h-2 max-w-[200px] mx-auto">
            <div
              className="h-2 bg-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${(monthsWithData / 2) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">{monthsWithData}/2 months</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-4 space-y-4">

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-slate-400 text-xs mb-1">Avg Income/mo</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(avgIncome, currency)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-slate-400 text-xs mb-1">Avg Expenses/mo</p>
          <p className="text-xl font-bold text-white">{formatCurrency(avgExpenses, currency)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-slate-400 text-xs mb-1">Avg Savings/mo</p>
          <p className={`text-xl font-bold ${avgIncome - avgExpenses >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
            {formatCurrency(avgIncome - avgExpenses, currency)}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-slate-400 text-xs mb-1">Save Rate</p>
          <p className="text-xl font-bold text-violet-400">
            {avgIncome > 0 ? Math.max(0, Math.round(((avgIncome - avgExpenses) / avgIncome) * 100)) : 0}%
          </p>
        </Card>
      </div>

      {/* Income vs Expenses chart */}
      <Card>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-4">Income vs Expenses</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barGap={2}>
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expenses" name="Expenses" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Income
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />Expenses
          </div>
        </div>
      </Card>

      {/* Spending tropes */}
      {tropes.length > 0 && (
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2 px-1">Your Spending Patterns</p>
          <div className="space-y-3">
            {tropes.map((t, i) => (
              <Card key={i} className={`border ${severityStyles[t.severity] || severityStyles.info}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{t.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white text-sm">{t.title}</p>
                      <span className={`text-xs font-medium ${severityLabel[t.severity]}`}>
                        {t.severity}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed mb-2">{t.description}</p>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500 text-xs">→</span>
                      <p className="text-slate-400 text-xs italic">{t.action}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tropes.length === 0 && (
        <Card className="border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="font-semibold text-emerald-400 text-sm">No concerning patterns detected!</p>
              <p className="text-slate-400 text-xs mt-0.5">Your spending looks balanced. Keep it up!</p>
            </div>
          </div>
        </Card>
      )}

      {/* Top categories breakdown */}
      {catTrends.length > 0 && (
        <Card>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-4">Top Categories (3 months)</p>
          <div className="space-y-3">
            {catTrends.map(cat => {
              const maxVal = Math.max(...cat.data.map(d => d.amount), 1)
              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span>{cat.emoji}</span>
                    <span className="text-sm text-white font-medium">{cat.label}</span>
                    <span className="ml-auto text-sm text-slate-400">{formatCurrency(cat.total, currency)} total</span>
                  </div>
                  <div className="flex gap-1 items-end h-10">
                    {cat.data.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t transition-all duration-500"
                          style={{
                            height: `${maxVal > 0 ? (d.amount / maxVal) * 32 : 2}px`,
                            backgroundColor: cat.color,
                            opacity: 0.7 + (i / cat.data.length) * 0.3,
                            minHeight: '3px',
                          }}
                        />
                        <span className="text-[9px] text-slate-500">{d.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Biggest splurge */}
      {biggestExpense && (
        <Card>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">Biggest Single Purchase</p>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{getCategoryById(biggestExpense.category).emoji}</div>
            <div className="flex-1">
              <p className="text-white font-semibold">{biggestExpense.description || getCategoryById(biggestExpense.category).label}</p>
              <p className="text-slate-500 text-xs">{biggestExpense.date} · {getCategoryById(biggestExpense.category).label}</p>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(biggestExpense.amount, currency)}</p>
          </div>
        </Card>
      )}
    </div>
  )
}
