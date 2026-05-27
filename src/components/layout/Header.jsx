import { useLocation } from 'react-router-dom'
import { useBudget } from '../../context/BudgetContext'
import { Zap } from 'lucide-react'

const PAGE_TITLES = {
  '/':         null, // Dashboard uses its own greeting
  '/income':   'Income',
  '/expenses': 'Expenses',
  '/goals':    'Goals',
  '/insights': 'Insights',
}

export default function Header() {
  const { points, settings } = useBudget()
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname]

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">
            {title || (
              <>Budget <span className="text-indigo-400">Brain</span></>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-800 rounded-full px-3 py-1.5">
          <Zap size={13} className="text-amber-400" fill="currentColor" />
          <span className="text-sm font-semibold text-amber-400">{points.toLocaleString()}</span>
          <span className="text-xs text-slate-500">pts</span>
        </div>
      </div>
    </header>
  )
}
