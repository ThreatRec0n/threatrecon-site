import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { DebriefPayload } from '../../types/debrief.types'

export function VerifyScreen() {
  const { id } = useParams()
  const payload = useMemo(() => {
    if (!id) return null
    try {
      const raw = localStorage.getItem(`tr_verify_${id}`)
      return raw ? (JSON.parse(raw) as DebriefPayload) : null
    } catch {
      return null
    }
  }, [id])

  if (!payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#060a12] px-6 text-center text-[#e8edf5]">
        <div className="font-display text-xl">Verification record not found on this device.</div>
        <p className="mt-4 max-w-lg font-mono text-[12px] text-[#8a9ab5]">
          Verification is stored locally in your browser for certificates generated on this workstation.
        </p>
        <Link className="mt-8 text-[#5e9bff] underline" to="/">
          Return to OPERATIVE
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060a12] px-8 py-12 text-[#e8edf5]">
      <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-[#0f1824] p-8 font-mono text-[12px]">
        <div className="font-display text-lg tracking-[0.25em] text-[#8a9ab5]">LOCAL VERIFICATION</div>
        <div className="mt-6 space-y-2">
          <div>
            <span className="text-[#8a9ab5]">Operative:</span> {payload.playerName}
          </div>
          <div>
            <span className="text-[#8a9ab5]">Case:</span> {payload.caseId}
          </div>
          <div>
            <span className="text-[#8a9ab5]">Score / Grade:</span> {payload.score} · {payload.grade}
          </div>
          <div>
            <span className="text-[#8a9ab5]">Difficulty:</span> {payload.difficulty}
          </div>
        </div>
      </div>
    </div>
  )
}
