import { useEffect, useRef, useState } from 'react'

interface Toast {
  id: string
  title: string
  body: string
}

export function SiemToastHost({ enabled = true }: { enabled?: boolean }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const tid = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    const messages: Omit<Toast, 'id'>[] = [
      {
        title: 'Microsoft Defender ATP',
        body: 'New alert: Suspicious PowerShell encoded command on endpoint.',
      },
      {
        title: 'SIEM Correlation',
        body: 'Possible lateral movement — multiple failed RDP auth from same ASN.',
      },
      {
        title: 'EDR',
        body: 'High-confidence: process injection observed in svchost.exe child.',
      },
      {
        title: 'Threat Intelligence',
        body: 'Outbound connection matches TOR exit node feed (185.220.x.x).',
      },
      {
        title: 'SOC Queue',
        body: 'New ticket INC-44902 — analyst requested memory triage on WORKSTATION.',
      },
      {
        title: 'Email Security',
        body: 'Spearphishing campaign tagged — attachment hash seen in 3 mailboxes.',
      },
    ]

    const scheduleNext = () => {
      const delay = 45_000 + Math.random() * 45_000
      tid.current = window.setTimeout(() => {
        const pick = messages[Math.floor(Math.random() * messages.length)]!
        const id = `toast-${Date.now()}`
        setToast({ id, ...pick })
        window.setTimeout(() => {
          setToast((t) => (t?.id === id ? null : t))
          scheduleNext()
        }, 8000)
      }, delay)
    }

    scheduleNext()
    return () => window.clearTimeout(tid.current)
  }, [enabled])

  if (!toast) return null

  return (
    <div
      className="pointer-events-none fixed bottom-[56px] right-4 z-[1100] w-[320px] animate-[slideIn_0.35s_ease-out]"
      role="status"
    >
      <div className="pointer-events-auto rounded border border-white/15 bg-[#1e1e1e] shadow-2xl shadow-black/80">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <div className="h-6 w-6 rounded bg-[#0078d4] font-mono text-[10px] font-bold leading-6 text-white text-center">
            SI
          </div>
          <div className="font-mono text-[11px] font-semibold text-[#e8edf5]">{toast.title}</div>
        </div>
        <p className="px-3 py-3 font-mono text-[11px] leading-snug text-[#c8d6e8]">{toast.body}</p>
        <div className="border-t border-white/10 px-3 py-1 text-right font-mono text-[9px] text-[#8a9ab5]">
          Auto-dismiss · 8s
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(24px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
