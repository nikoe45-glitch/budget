import { useEffect, useState } from 'react'

/**
 * Animated progress bar
 * @param {number} value - 0 to 100
 * @param {string} color - 'green'|'amber'|'red'|'indigo'|'auto' (auto = based on value)
 * @param {boolean} showLabel
 * @param {string} height - tailwind height class
 */
export default function ProgressBar({ value = 0, color = 'auto', showLabel = false, height = 'h-3', className = '' }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(Math.min(100, Math.max(0, value))), 80)
    return () => clearTimeout(timer)
  }, [value])

  const resolvedColor = color === 'auto'
    ? value >= 100 ? 'red' : value >= 85 ? 'amber' : 'green'
    : color

  const barColors = {
    green: 'from-emerald-500 to-emerald-400',
    amber: 'from-amber-500 to-yellow-400',
    red: 'from-red-500 to-orange-500',
    indigo: 'from-indigo-500 to-violet-500',
    blue: 'from-blue-500 to-cyan-400',
    pink: 'from-pink-500 to-rose-400',
  }

  const gradient = barColors[resolvedColor] || barColors.indigo

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-slate-700 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} bg-gradient-to-r ${gradient} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${displayed}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-400">{Math.round(value)}%</span>
        </div>
      )}
    </div>
  )
}
