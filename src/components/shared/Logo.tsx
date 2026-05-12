export function ThreatReconLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <svg
        viewBox="0 0 48 48"
        className="h-10 w-10 text-amber"
        aria-hidden
      >
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="24"
          cy="24"
          r="7"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M24 4v8M24 36v8M4 24h8M36 24h8"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      <div className="font-display text-xl tracking-[0.2em] text-ink-primary">
        THREAT<span className="text-amber">RECON</span>
        <span className="text-ink-muted">.IO</span>
      </div>
    </div>
  );
}
