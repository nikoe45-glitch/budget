import { useState } from 'react'
import { useBudget } from '../context/BudgetContext'
import { CATEGORIES } from '../utils/categories'
import { generateSampleData } from '../utils/sampleData'
import { ChevronRight, Sparkles } from 'lucide-react'

const STEPS = 3

export default function Onboarding() {
  const { completeOnboarding } = useBudget()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [avgIncome, setAvgIncome] = useState(2500)
  const [selectedCats, setSelectedCats] = useState(['groceries','food','transport','bills','entertainment'])

  const toggleCat = (id) => setSelectedCats(prev =>
    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
  )

  const finish = (withSample) => {
    completeOnboarding({
      firstName: name.trim() || 'Friend',
      avgIncome,
      selectedCategories: selectedCats,
      sampleData: withSample ? generateSampleData() : null,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-12 pb-6">
        {Array.from({ length: STEPS }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === step ? 'w-6 h-2 bg-indigo-500' : i < step ? 'w-2 h-2 bg-indigo-500/60' : 'w-2 h-2 bg-slate-700'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full">

        {/* Step 0: Name */}
        {step === 0 && (
          <div className="flex flex-col flex-1">
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-5xl mb-6">🧠</div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Welcome to<br/><span className="text-indigo-400">Budget Brain</span>
              </h1>
              <p className="text-slate-400 mb-10 text-lg leading-relaxed">
                Built for commission earners & ADHD minds. Let's get you set up!
              </p>
              <label className="text-slate-400 text-sm font-medium mb-2">What should we call you?</label>
              <input
                className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 text-xl text-white placeholder-slate-600 w-full focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Your first name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(1)}
              />
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold rounded-2xl py-4 mb-8 flex items-center justify-center gap-2 text-lg transition-colors"
            >
              Let's go <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 1: Avg income */}
        {step === 1 && (
          <div className="flex flex-col flex-1">
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-5xl mb-6">💰</div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Hey {name}! What's your rough average monthly income?
              </h1>
              <p className="text-slate-400 mb-10">
                Don't worry — this is just a starting estimate. Budget Brain learns your actual pattern over time.
              </p>
              {/* Slider */}
              <div className="bg-slate-800 rounded-2xl p-5">
                <div className="text-4xl font-bold text-indigo-400 text-center mb-4">
                  €{avgIncome.toLocaleString()}
                </div>
                <input
                  type="range"
                  min={200} max={10000} step={100}
                  value={avgIncome}
                  onChange={e => setAvgIncome(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>€200</span><span>€10,000</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <p className="text-xs text-indigo-300">
                  💡 Commission income is variable — Budget Brain will track your actual income and calculate a rolling 3-month average automatically.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mb-8">
              <button onClick={() => setStep(0)} className="flex-1 bg-slate-800 text-slate-300 font-medium rounded-2xl py-4">Back</button>
              <button onClick={() => setStep(2)} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl py-4 flex items-center justify-center gap-2">
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Categories + start */}
        {step === 2 && (
          <div className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto">
              <div className="text-5xl mb-6">🛒</div>
              <h1 className="text-2xl font-bold text-white mb-3">Pick your spending categories</h1>
              <p className="text-slate-400 mb-6">Select the ones that apply to your life.</p>

              <div className="grid grid-cols-3 gap-2 mb-8">
                {CATEGORIES.filter(c => c.id !== 'other').map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCat(cat.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                      selectedCats.includes(cat.id)
                        ? 'border-indigo-500 bg-indigo-500/15 scale-[1.03]'
                        : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-[11px] text-center leading-tight text-slate-300">{cat.label}</span>
                  </button>
                ))}
              </div>

              <div className="text-sm text-slate-400 mb-6 text-center">{selectedCats.length} selected</div>
            </div>

            <div className="flex flex-col gap-3 mb-8 flex-shrink-0">
              <button
                onClick={() => finish(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl py-4 flex items-center justify-center gap-2"
              >
                <Sparkles size={18} /> Load sample data & explore
              </button>
              <button
                onClick={() => finish(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-2xl py-4"
              >
                Start fresh with my own data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
