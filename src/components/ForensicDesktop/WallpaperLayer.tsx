import type { CSSProperties, ReactNode } from 'react';
import type { WallpaperKey } from '@/investigation/suspectWorkstation';

const wallpapers: Record<
  WallpaperKey,
  { style: CSSProperties; pattern?: ReactNode }
> = {
  'sarah-hike': {
    style: {
      background:
        'linear-gradient(180deg,#87CEEB 0%,#98D4E8 30%,#4a7c59 55%,#3d6b4a 65%,#5c8a45 75%,#8B7355 85%,#7a6245 100%)',
    },
    pattern: (
      <svg
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        preserveAspectRatio="none"
        viewBox="0 0 400 240"
      >
        <path
          fill="#1a3d2e"
          d="M0 180 L80 120 L140 150 L200 90 L260 130 L320 70 L400 100 V240 H0 Z"
        />
      </svg>
    ),
  },
  'marcus-dark': {
    style: {
      background: 'linear-gradient(135deg,#0a0a1a 0%,#1a1a2e 50%,#16213e 100%)',
    },
    pattern: (
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-30deg, transparent, transparent 20px, #fff 20px, #fff 21px)',
        }}
      />
    ),
  },
  'linda-corp': {
    style: {
      background: 'linear-gradient(160deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)',
    },
  },
  'ryan-tech': {
    style: {
      background:
        'linear-gradient(135deg,#0d0d1a 0%,#1a0d2e 30%,#0d1a2e 60%,#0d0d1a 100%)',
    },
    pattern: (
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, #7cfffb22 0, transparent 2px),
            radial-gradient(circle at 70% 60%, #ff7bff22 0, transparent 2px),
            radial-gradient(circle at 40% 80%, #ffff7722 0, transparent 2px)`,
          backgroundSize: '180px 180px',
        }}
      />
    ),
  },
  'diana-circuit': {
    style: { background: '#0a0f1a' },
    pattern: (
      <svg
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        viewBox="0 0 800 600"
      >
        <path
          fill="none"
          stroke="#4af"
          strokeWidth="1"
          d="M40 500 H760 M120 500 V360 M320 360 H620 M620 360 V180"
        />
        <path
          fill="none"
          stroke="#4af"
          strokeWidth="1"
          d="M200 420 H440 V260 H660"
        />
      </svg>
    ),
  },
  'ubuntu-jelly': {
    style: {
      background:
        'radial-gradient(ellipse 80% 60% at 20% 80%, #2d0e4a 0%, #3a1566 15%, #1a0830 35%, #0a0515 55%, #050210 75%, #020108 100%)',
    },
    pattern: (
      <>
        <svg
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          viewBox="0 0 600 400"
        >
          <ellipse cx="200" cy="260" rx="140" ry="180" fill="#772aff55" />
          <ellipse cx="320" cy="220" rx="100" ry="150" fill="#e9542033" />
        </svg>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #ffffff33 0, transparent 1.5px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </>
    ),
  },
};

export function WallpaperLayer({
  wallpaperKey,
}: {
  wallpaperKey: WallpaperKey;
}) {
  const w = wallpapers[wallpaperKey];
  return (
    <div className="absolute inset-0 overflow-hidden" style={w.style}>
      {w.pattern}
    </div>
  );
}
