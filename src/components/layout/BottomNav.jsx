import { NavLink, useLocation } from 'react-router-dom'
import { Home, TrendingUp, CreditCard, Target, Lightbulb } from 'lucide-react'

const tabs = [
  { to: '/',          Icon: Home,        label: 'Home'     },
  { to: '/income',    Icon: TrendingUp,  label: 'Income'   },
  { to: '/expenses',  Icon: CreditCard,  label: 'Expenses' },
  { to: '/goals',     Icon: Target,      label: 'Goals'    },
  { to: '/insights',  Icon: Lightbulb,   label: 'Insights' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ to, Icon, label }) => {
          const active = location.pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl min-w-[56px]"
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-indigo-500/20' : ''}`}>
                <Icon
                  size={22}
                  className={`transition-colors ${active ? 'text-indigo-400' : 'text-slate-500'}`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-indigo-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
