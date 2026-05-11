export function Timer({ seconds, totalSeconds }: { seconds: number; totalSeconds?: number }) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const warn = seconds < 120
  const lowish = totalSeconds ? seconds < totalSeconds * 0.2 : false
  const color = warn ? 'text-red-400 animate-pulse' : lowish ? 'text-yellow-400' : 'text-[#5e9bff]'
  return (
    <div className={`font-mono text-sm tracking-widest ${color}`}>
      {h > 0 ? `${String(h)}:` : ''}
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  )
}
