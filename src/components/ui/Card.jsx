export default function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`bg-slate-800 rounded-2xl p-4 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
