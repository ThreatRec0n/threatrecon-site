import { Link } from 'react-router-dom'
import { usePlayer } from '../../contexts/PlayerContext'
import { AttackHeatmap } from '../../components/AttackHeatmap/AttackHeatmap'

export function DashboardScreen() {
  const { profile, leaderboard } = usePlayer()

  return (
    <div className="min-h-screen bg-[#060a12] px-8 py-12 text-[#e8edf5]">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <div className="font-display text-2xl tracking-[0.12em]">OPERATIVE DASHBOARD</div>
          <Link className="font-mono text-[12px] text-[#5e9bff] hover:underline" to="/">
            Home
          </Link>
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <Stat label="Cases completed" value={String(profile.casesCompleted)} />
          <Stat label="Average score" value={profile.casesCompleted ? profile.averageScore.toFixed(1) : '—'} />
          <Stat label="Best time (sec)" value={profile.bestTime !== null ? String(profile.bestTime) : '—'} />
        </section>

        <section className="mt-12">
          <div className="font-mono text-[11px] uppercase tracking-[0.35em] text-[#8a9ab5]">Leaderboard (local)</div>
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full border-collapse font-mono text-[12px]">
              <thead className="bg-[#0f1824] text-[11px] uppercase text-[#8a9ab5]">
                <tr>
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Operative</th>
                  <th className="p-3 text-left">Score</th>
                  <th className="p-3 text-left">Difficulty</th>
                  <th className="p-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r, i) => (
                  <tr key={r.id} className="border-t border-white/5">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">{r.name}</td>
                    <td className="p-3">{r.score}</td>
                    <td className="p-3">{r.difficulty}</td>
                    <td className="p-3">{r.timeSeconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <AttackHeatmap />
        </section>

        <section className="mt-12">
          <div className="font-mono text-[11px] uppercase tracking-[0.35em] text-[#8a9ab5]">Case history</div>
          <div className="mt-4 space-y-3 font-mono text-[12px]">
            {profile.caseHistory.length === 0 ? (
              <div className="text-[#4a566b]">No completed cases yet.</div>
            ) : (
              profile.caseHistory.map((c) => (
                <div key={c.caseId + c.completedAt} className="rounded-lg border border-white/10 bg-[#0f1824] p-4">
                  <div className="flex justify-between gap-4">
                    <div>{c.caseId}</div>
                    <div className="text-[#5e9bff]">
                      {c.score} · {c.grade}
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-[#8a9ab5]">{new Date(c.completedAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1824] p-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#8a9ab5]">{label}</div>
      <div className="mt-3 font-display text-3xl text-[#e8edf5]">{value}</div>
    </div>
  )
}
