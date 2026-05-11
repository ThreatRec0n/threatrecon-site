import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 18, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  )
}

export function IconTerminal(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 9l3 3-3 3" />
      <path d="M12 15h6" />
    </Base>
  )
}

export function IconCpu(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </Base>
  )
}

export function IconList(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </Base>
  )
}

export function IconDatabase(p: IconProps) {
  return (
    <Base {...p}>
      <ellipse cx="12" cy="5" rx="8" ry="2.5" />
      <path d="M4 5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5" />
      <path d="M4 11v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6" />
    </Base>
  )
}

export function IconNetwork(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="4" r="2" />
      <circle cx="4" cy="20" r="2" />
      <circle cx="20" cy="20" r="2" />
      <path d="M12 6v6M6 18l5-5M18 18l-5-5" />
    </Base>
  )
}

export function IconClock(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Base>
  )
}

export function IconUsers(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.4 3.4-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16 14.5c2.4 0 4.4 1.4 5 3.8" />
    </Base>
  )
}

export function IconFolder(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </Base>
  )
}

export function IconShield(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 3l8 3v5c0 5-3.5 8.6-8 10-4.5-1.4-8-5-8-10V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </Base>
  )
}

export function IconAlert(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M10.3 3.7L1.8 18.3a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="17" r=".8" fill="currentColor" />
    </Base>
  )
}

export function IconClose(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Base>
  )
}

export function IconMinus(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M5 12h14" />
    </Base>
  )
}

export function IconSquare(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="5" y="5" width="14" height="14" rx="1" />
    </Base>
  )
}

export function IconComputer(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="4" y="4" width="16" height="12" rx="1" />
      <path d="M8 16h8M10 18h4" />
    </Base>
  )
}

export function IconRecycle(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M9 4h6l1 3H8l1-3z" />
      <path d="M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z" />
      <path d="M10 11v6M12 11v6M14 11v6" />
    </Base>
  )
}

export function IconDocuments(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 6h8l2 2h6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M12 6v4h5" />
    </Base>
  )
}

export function IconTimeline(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 3v18" />
      <circle cx="12" cy="7" r="2" fill="currentColor" />
      <circle cx="12" cy="13" r="2" />
      <circle cx="12" cy="19" r="2" />
    </Base>
  )
}

export function IconWifi(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M5 12c4-4 10-4 14 0" />
      <path d="M8 15c3-2 7-2 10 0" />
      <path d="M11 18h2" />
    </Base>
  )
}

export function IconVolume(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M9 9v6l4 3V6l-4 3z" />
      <path d="M15 10c1 1 1 3 0 4M17 8c2 2 2 6 0 8" />
    </Base>
  )
}

export function IconWindowsLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M3 5.5l7-1v6.5H3V5.5zm7 7.2l-7-1.1V18l7 1V12.7zm1.2-8.4L21 3v7h-9.8V4.3zM21 12.3l-9.8-1.5V21l9.8-1.4v-7.3z" />
    </svg>
  )
}
