import type { AvatarId } from '@/types/employee.types';

const frame =
  'rounded-md border-4 border-[#d8cfc0] bg-[#c9bfb1] p-1 shadow polaroid';

export function Avatar({
  id,
  className,
  label,
}: {
  id: AvatarId;
  className?: string;
  label?: string;
}) {
  return (
    <div className={className}>
      <div className={frame}>
        <svg
          viewBox="0 0 120 140"
          className="h-32 w-28 bg-[#ded8cc]"
          role="img"
          aria-label={label ?? id}
        >
          <rect width="120" height="140" fill="#d8d2c8" />
          {renderAvatar(id)}
        </svg>
      </div>
      {label ? (
        <p className="mt-1 text-center font-mono text-[10px] text-ink-muted">
          {label}
        </p>
      ) : null}
    </div>
  );
}

function renderAvatar(id: AvatarId) {
  switch (id) {
    case 'AVATAR_F1':
      return (
        <>
          <ellipse cx="60" cy="128" rx="48" ry="12" fill="#2a2622" opacity="0.12" />
          <path d="M30 110 Q60 110 90 110 L85 135 H35 Z" fill="#1f4d7a" />
          <path d="M40 110 Q60 120 80 110 V135 H40 Z" fill="#f0ebe3" />
          <ellipse cx="60" cy="62" rx="28" ry="34" fill="#c6865b" />
          <path d="M38 52 Q60 34 82 52 Q82 78 60 84 Q38 78 38 52" fill="#2c2520" />
          <ellipse cx="46" cy="60" rx="4" ry="5" fill="#1b1b1b" />
          <ellipse cx="74" cy="60" rx="4" ry="5" fill="#1b1b1b" />
          <path d="M48 72 Q60 78 72 72" stroke="#5c4033" strokeWidth="2" fill="none" />
          <rect x="44" y="56" width="32" height="10" rx="2" fill="#333" opacity="0.35" />
          <path d="M46 56 H74" stroke="#111" strokeWidth="2" />
        </>
      );
    case 'AVATAR_M1':
      return (
        <>
          <ellipse cx="60" cy="128" rx="48" ry="12" fill="#2a2622" opacity="0.12" />
          <path d="M32 112 H88 V136 H32 Z" fill="#2f3542" />
          <ellipse cx="60" cy="60" rx="27" ry="33" fill="#e3cba8" />
          <path d="M38 48 Q60 28 82 48 Q86 65 78 78 Q60 88 42 78 Q34 65 38 48" fill="#6f6b68" />
          <ellipse cx="47" cy="58" rx="4" ry="4.5" fill="#111" />
          <ellipse cx="73" cy="58" rx="4" ry="4.5" fill="#111" />
          <path d="M48 74 Q60 80 72 74" stroke="#6b4f3b" strokeWidth="2" fill="none" />
        </>
      );
    case 'AVATAR_F2':
      return (
        <>
          <ellipse cx="60" cy="128" rx="48" ry="12" fill="#2a2622" opacity="0.12" />
          <path d="M30 108 Q60 118 90 108 V136 H30 Z" fill="#1f3d56" />
          <ellipse cx="60" cy="62" rx="29" ry="35" fill="#7d4b32" />
          <path d="M34 48 Q60 26 86 48 Q90 95 60 102 Q30 95 34 48" fill="#1c1512" />
          <ellipse cx="46" cy="58" rx="4" ry="5" fill="#111" />
          <ellipse cx="74" cy="58" rx="4" ry="5" fill="#111" />
          <path d="M48 74 Q60 82 72 74" stroke="#3b2418" strokeWidth="2" fill="none" />
        </>
      );
    case 'AVATAR_M2':
      return (
        <>
          <ellipse cx="60" cy="128" rx="48" ry="12" fill="#2a2622" opacity="0.12" />
          <path d="M34 112 H86 V136 H34 Z" fill="#243042" />
          <ellipse cx="60" cy="62" rx="28" ry="34" fill="#a56c47" />
          <path d="M38 48 Q60 30 82 48 Q84 78 60 88 Q36 78 38 48" fill="#221712" />
          <ellipse cx="47" cy="60" rx="4" ry="4.5" fill="#111" />
          <ellipse cx="73" cy="60" rx="4" ry="4.5" fill="#111" />
          <path d="M52 78 Q60 82 68 78" stroke="#4b3326" strokeWidth="2" fill="none" />
          <circle cx="54" cy="70" r="1.2" fill="#c6865b" opacity="0.35" />
          <circle cx="68" cy="69" r="1.2" fill="#c6865b" opacity="0.35" />
        </>
      );
    case 'AVATAR_F3':
      return (
        <>
          <ellipse cx="60" cy="128" rx="48" ry="12" fill="#2a2622" opacity="0.12" />
          <path d="M32 110 H88 V136 H32 Z" fill="#444d5c" />
          <ellipse cx="60" cy="62" rx="28" ry="34" fill="#e5cdb1" />
          <path d="M38 44 Q60 36 82 44 Q88 68 78 84 Q60 94 42 84 Q32 68 38 44" fill="#c7c2bd" />
          <ellipse cx="47" cy="58" rx="4" ry="4.5" fill="#111" />
          <ellipse cx="73" cy="58" rx="4" ry="4.5" fill="#111" />
          <path d="M48 74 Q60 80 72 74" stroke="#7a5e48" strokeWidth="2" fill="none" />
          <rect x="42" y="54" width="36" height="9" rx="2" fill="#333" opacity="0.35" />
          <path d="M44 56 H76" stroke="#111" strokeWidth="1.5" />
        </>
      );
    case 'AVATAR_M3':
      return (
        <>
          <ellipse cx="60" cy="128" rx="48" ry="12" fill="#2a2622" opacity="0.12" />
          <path d="M34 112 H86 V136 H34 Z" fill="#2f4f6b" />
          <ellipse cx="60" cy="62" rx="27" ry="33" fill="#e2c4a8" />
          <path d="M40 46 Q60 32 80 46 Q84 68 76 82 Q60 90 44 82 Q36 68 40 46" fill="#b88963" />
          <ellipse cx="47" cy="58" rx="4" ry="4.5" fill="#111" />
          <ellipse cx="73" cy="58" rx="4" ry="4.5" fill="#111" />
          <path d="M48 74 Q60 80 72 74" stroke="#8c6249" strokeWidth="2" fill="none" />
          <circle cx="52" cy="66" r="1.3" fill="#c6865b" opacity="0.35" />
          <circle cx="70" cy="65" r="1.3" fill="#c6865b" opacity="0.35" />
          <circle cx="62" cy="67" r="1.3" fill="#c6865b" opacity="0.35" />
        </>
      );
    case 'AVATAR_F4':
      return (
        <>
          <ellipse cx="60" cy="128" rx="48" ry="12" fill="#2a2622" opacity="0.12" />
          <path d="M32 110 H88 V136 H32 Z" fill="#3d3038" />
          <ellipse cx="60" cy="62" rx="28" ry="34" fill="#c99168" />
          <path d="M34 42 Q60 24 86 42 Q92 110 60 118 Q28 110 34 42" fill="#141010" />
          <ellipse cx="47" cy="58" rx="4" ry="4.5" fill="#111" />
          <ellipse cx="73" cy="58" rx="4" ry="4.5" fill="#111" />
          <path d="M48 74 Q60 80 72 74" stroke="#5d3d30" strokeWidth="2" fill="none" />
        </>
      );
    case 'AVATAR_M4':
      return (
        <>
          <ellipse cx="60" cy="128" rx="48" ry="12" fill="#2a2622" opacity="0.12" />
          <path d="M34 112 H86 V136 H34 Z" fill="#3d4452" />
          <ellipse cx="60" cy="60" rx="27" ry="33" fill="#6b482f" />
          <path d="M42 44 Q60 40 78 44 Q82 58 78 72 Q60 82 42 72 Q38 58 42 44" fill="#4c382c" />
          <path d="M48 88 Q60 96 72 88 Q68 108 60 112 Q52 108 48 88" fill="#cccccc" />
          <ellipse cx="47" cy="56" rx="4" ry="4.5" fill="#111" />
          <ellipse cx="73" cy="56" rx="4" ry="4.5" fill="#111" />
          <path d="M48 70 Q60 76 72 70" stroke="#3b261c" strokeWidth="2" fill="none" />
        </>
      );
    default:
      return null;
  }
}
