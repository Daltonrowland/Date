export default function QuizProgress({ current, total, category }) {
  const pct = Math.round((current / total) * 100)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="text-white/40">{category}</span>
        <span className="text-white/40">{current} / {total}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full score-gradient rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
