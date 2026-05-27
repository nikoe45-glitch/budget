import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BudgetProvider, useBudget } from './context/BudgetContext'
import BottomNav from './components/layout/BottomNav'
import Header from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Expenses from './pages/Expenses'
import Goals from './pages/Goals'
import Insights from './pages/Insights'
import Onboarding from './pages/Onboarding'

function AppRoutes() {
  const { settings } = useBudget()

  if (!settings.onboarded) {
    return <Onboarding />
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/income" element={<Income />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <BudgetProvider>
        <AppRoutes />
      </BudgetProvider>
    </BrowserRouter>
  )
}
