import clsx from 'clsx';

type Props = {
  employeeId: string;
  os: 'windows11' | 'ubuntu2204';
  selectedIcon: string | null;
  onSelectIcon: (id: string | null) => void;
  onActivateIcon: (id: string) => void;
};

const ICON_BASE =
  'flex cursor-pointer flex-col items-center gap-1 rounded border border-transparent p-2 text-center font-mono text-[10px] text-white/90 shadow-sm transition hover:bg-white/10';

export function DesktopIconGrid({
  employeeId,
  os,
  selectedIcon,
  onSelectIcon,
  onActivateIcon,
}: Props) {
  if (os === 'ubuntu2204') {
    return null;
  }

  const commonTopLeft = [
    { id: 'thispc', label: 'This PC', glyph: '🖥' },
    ...(employeeId === 'emp-sarah-chen'
      ? ([
          { id: 'roadmap-lnk', label: 'Q3-Roadmap-FINAL', glyph: '📕' },
          { id: 'personal', label: 'Personal', glyph: '📂' },
          { id: 'notes', label: 'Notes.txt', glyph: '📝' },
          { id: 'edge-desk', label: 'Microsoft Edge', glyph: '🌐' },
          { id: 'teams-desk', label: 'Teams', glyph: '💬' },
        ] as const)
      : []),
  ];

  return (
    <>
      <div className="pointer-events-auto absolute left-5 top-5 flex flex-col gap-3">
        {commonTopLeft.map((ic) => (
          <button
            key={ic.id}
            type="button"
            className={clsx(
              ICON_BASE,
              selectedIcon === ic.id && 'border-sky-400/80 bg-sky-500/15',
            )}
            onClick={() =>
              selectedIcon === ic.id ? onActivateIcon(ic.id) : onSelectIcon(ic.id)
            }
            onDoubleClick={() => onActivateIcon(ic.id)}
          >
            <span className="text-2xl">{ic.glyph}</span>
            <span className="max-w-[88px] leading-tight">{ic.label}</span>
          </button>
        ))}
      </div>
      <div className="pointer-events-auto absolute bottom-16 right-6 flex flex-col gap-3">
        <button
          type="button"
          className={clsx(
            ICON_BASE,
            selectedIcon === 'recycle' && 'border-sky-400/80 bg-sky-500/15',
          )}
          onClick={() =>
            selectedIcon === 'recycle'
              ? onActivateIcon('recycle')
              : onSelectIcon('recycle')
          }
          onDoubleClick={() => onActivateIcon('recycle')}
        >
          <span className="text-2xl">🗑</span>
          Recycle Bin
        </button>
      </div>
    </>
  );
}
