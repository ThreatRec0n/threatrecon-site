import { useEffect, useState } from 'react'

export type AuthShellPhase = 'lock' | 'login'

export function Win11LockScreen({
  displayName,
  onWake,
}: {
  displayName: string
  onWake: () => void
}) {
  const [hintPulse, setHintPulse] = useState(false)
  const [tick, setTick] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const d = new Date(tick)
  const hh = d.getHours() % 12 || 12
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM'
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const clockLine = `${hh}:${mm} ${ampm}`
  const dateLine = `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`

  return (
    <button
      type="button"
      className="tr-win11-bloom absolute inset-0 z-[3000] flex cursor-pointer flex-col items-center justify-center border-none outline-none"
      style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI Light', 'Segoe UI', system-ui, sans-serif" }}
      onClick={() => {
        setHintPulse(true)
        window.setTimeout(() => setHintPulse(false), 320)
        onWake()
      }}
      aria-label="Unlock workstation"
    >
      <div className="pointer-events-none mb-4 text-[clamp(3.5rem,14vw,6rem)] font-light tabular-nums tracking-tight text-white drop-shadow-lg">
        {clockLine}
      </div>
      <div className="pointer-events-none text-xl font-light text-white/90">{dateLine}</div>
      <div className="pointer-events-none mt-16 max-w-md px-6 text-center text-sm font-normal text-white/65">
        {displayName}
      </div>
      <div
        className={`pointer-events-none mt-10 text-sm text-white/50 transition-opacity duration-300 ${hintPulse ? 'opacity-100' : 'opacity-80'}`}
      >
        Click or press any key to unlock
      </div>
    </button>
  )
}

export function Win11LoginScreen({
  displayName,
  onSignedIn,
}: {
  displayName: string
  onSignedIn: () => void
}) {
  const [pwd, setPwd] = useState('')
  const [show, setShow] = useState(false)

  const submit = () => {
    onSignedIn()
  }

  return (
    <div
      className="absolute inset-0 z-[3000] flex items-center justify-center"
      style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif" }}
    >
      <div className="tr-win11-bloom absolute inset-0" aria-hidden />
      <div className="absolute inset-0 bg-black/35 backdrop-blur-md" aria-hidden />
      <div className="relative z-[1] flex w-full max-w-sm flex-col items-center px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#3c3c3c] text-4xl text-white/90 shadow-inner">
          👤
        </div>
        <div className="mt-4 text-xl font-semibold text-white">{displayName}</div>
        <div className="mt-1 text-center text-[13px] text-white/70">SOC Analyst — ThreatRecon OPERATIVE</div>

        <form
          className="mt-8 w-full"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div className="flex overflow-hidden rounded border border-white/15 bg-black/40 shadow-lg backdrop-blur">
            <input
              type={show ? 'text' : 'password'}
              autoFocus
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="PIN / Password"
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[13px] text-white outline-none placeholder:text-white/35"
            />
            <button
              type="button"
              className="border-l border-white/10 px-2 text-[11px] text-[#a8d4ff] hover:bg-white/5"
              onClick={() => setShow((s) => !s)}
            >
              {show ? 'Hide' : 'Show'}
            </button>
            <button
              type="submit"
              className="flex w-10 items-center justify-center border-l border-white/10 bg-white/10 text-white hover:bg-white/15"
              title="Sign in"
            >
              →
            </button>
          </div>
        </form>
        <button type="button" className="mt-4 text-[12px] text-[#7eb8ff] hover:underline">
          Forgot PIN?
        </button>
      </div>
    </div>
  )
}
