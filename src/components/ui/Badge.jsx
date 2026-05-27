const variants = {
  high:     'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  lean:     'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  standard: 'bg-slate-700 text-slate-300',
  danger:   'bg-red-500/20 text-red-400 border border-red-500/30',
  warning:  'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  info:     'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  indigo:   'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
}

export default function Badge({ label, variant = 'standard', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.standard} ${className}`}>
      {label}
    </span>
  )
}
