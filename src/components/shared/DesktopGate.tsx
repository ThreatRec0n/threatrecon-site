export function DesktopGate({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="hidden min-[1280px]:block">{children}</div>
      <div className="flex min-h-screen items-center justify-center px-6 min-[1280px]:hidden">
        <div className="max-w-md border border-border-active bg-bg-secondary p-6 text-center font-display text-ink-primary shadow polaroid">
          <p className="text-lg text-amber">
            ThreatRecon INSIDE JOB requires a desktop screen.
          </p>
          <p className="mt-3 font-mono text-sm text-ink-secondary">
            Please open on a computer with at least 1280px screen width.
          </p>
        </div>
      </div>
    </div>
  );
}
