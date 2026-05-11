/** Win11-style glyphs used across the simulated shell (avoid implying MS endorsement beyond UX training). */

export function IconWin11Start({ size = 20 }: { size?: number }) {
  const u = size / 5
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden className="shrink-0">
      <rect x={1} y={1} width={u * 2 - 1} height={u * 2 - 1} rx={0.5} fill="#0078d4" />
      <rect x={u * 2 + 1} y={1} width={u * 2 - 1} height={u * 2 - 1} rx={0.5} fill="#ffb900" />
      <rect x={1} y={u * 2 + 1} width={u * 2 - 1} height={u * 2 - 1} rx={0.5} fill="#00bcf2" />
      <rect x={u * 2 + 1} y={u * 2 + 1} width={u * 2 - 1} height={u * 2 - 1} rx={0.5} fill="#ff4343" />
    </svg>
  )
}

export function IconEdgeLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="te" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ebeff" />
          <stop offset="100%" stopColor="#0f6cbd" />
        </linearGradient>
      </defs>
      <path
        fill="url(#te)"
        d="M12 2c4.5 0 8 3 9 7.2-2.5-.9-5.2-.4-7.2 1.3C11 13 10 15 10 17c0 2.8 2.2 5 5 5 3 0 5-2.4 5-5.5v-.7h-4.5c.3 1.4 1.2 2.4 2.6 2.7-1.5 2.2-4 3.5-6.6 3.5-4.4 0-8-3.6-8-8 0-6 5-11 11-11 4 0 7.5 2.2 9.3 5.5-.9-4.5-5-8-10.3-8z"
      />
    </svg>
  )
}

export function IconTaskView({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0 text-[#eaeaea]">
      <rect x={3} y={5} width={9} height={14} rx={1} fill="currentColor" opacity={0.92} />
      <rect x={13} y={7} width={8} height={12} rx={1} fill="currentColor" opacity={0.55} />
    </svg>
  )
}

export function IconBattery({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0 text-[#eaeaea]">
      <rect x={2} y={7} width={18} height={10} rx={2} fill="none" stroke="currentColor" strokeWidth={1.5} />
      <rect x={21} y={10} width={2} height={4} rx={0.5} fill="currentColor" />
      <rect x={4} y={9} width={12} height={6} rx={1} fill="currentColor" opacity={0.85} />
    </svg>
  )
}

export function IconBell({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0 text-[#eaeaea]">
      <path
        fill="currentColor"
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"
      />
    </svg>
  )
}

export function IconWidgets({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0 text-[#eaeaea]">
      <rect x={3} y={3} width={8} height={8} rx={1} fill="currentColor" opacity={0.9} />
      <rect x={13} y={3} width={8} height={8} rx={1} fill="currentColor" opacity={0.55} />
      <rect x={3} y={13} width={18} height={8} rx={1} fill="currentColor" opacity={0.72} />
    </svg>
  )
}

export function IconWifiBars({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0 text-[#eaeaea]">
      <path
        fill="currentColor"
        d="M12 18c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6.09-3.85L12 8l6.09 6.15c.34.36.33.93-.04 1.27-.35.33-.91.33-1.26 0L12 10.23l-4.79 5.19c-.35.33-.91.33-1.26 0-.37-.34-.38-.91-.04-1.27zM12 4l9 9.75c.37.34.37.92 0 1.26-.35.33-.91.33-1.26 0L12 6.48 4.26 15.01c-.35.33-.91.33-1.26 0-.37-.34-.37-.92 0-1.26L12 4z"
      />
    </svg>
  )
}

export function IconSpeaker({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0 text-[#eaeaea]">
      <path
        fill="currentColor"
        d="M3 10v4h4l5 5V5L7 10H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
      />
    </svg>
  )
}

export function Win11WatermarkLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={120}
      height={120}
      viewBox="0 0 100 100"
      aria-hidden
      opacity={0.03}
    >
      <rect x={12} y={12} width={34} height={34} rx={2} fill="#ffffff" />
      <rect x={54} y={12} width={34} height={34} rx={2} fill="#ffffff" />
      <rect x={12} y={54} width={34} height={34} rx={2} fill="#ffffff" />
      <rect x={54} y={54} width={34} height={34} rx={2} fill="#ffffff" />
    </svg>
  )
}
