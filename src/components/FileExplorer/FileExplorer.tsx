import { useMemo, useState } from 'react'
import { useGame } from '../../contexts/GameContext'
import { baselineFiles, type BaselineFile } from '../../data/baselineSystem'
import { IconFolder } from '../shared/Icons'

const fmtTime = (t: string) => t.replace('T', ' ').replace('Z', ' UTC')
const fmtSize = (kb?: number) => {
  if (kb === undefined) return ''
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb.toLocaleString()} KB`
}

const QUICK_PATHS = [
  { label: 'Desktop', sub: 'Desktop' },
  { label: 'Documents', sub: 'Documents' },
  { label: 'Downloads', sub: 'Downloads' },
  { label: 'Pictures', sub: 'Pictures' },
  { label: 'AppData', sub: 'AppData' },
  { label: 'System32', root: 'C:\\Windows\\System32' },
  { label: 'Program Files', root: 'C:\\Program Files' },
]

export function FileExplorer() {
  const { vfs, caseDef } = useGame()
  const home = caseDef ? `C:\\Users\\${caseDef.primaryUser}` : 'C:\\'
  const [path, setPath] = useState<string>(() => vfs?.getCurrentPath() ?? home)

  const baselineForHome = useMemo<BaselineFile[]>(() => {
    if (!caseDef) return []
    return baselineFiles(caseDef.primaryUser)
  }, [caseDef])

  /** Render baseline cards when looking at the user's home; otherwise dump VFS listing */
  const showingHome = !!caseDef && path.toLowerCase() === home.toLowerCase()

  if (!vfs || !caseDef) return null

  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] text-xs text-[#e8edf5]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#0f1824] px-3 py-2">
        <button
          type="button"
          className="rounded border border-white/10 px-2 py-1 text-[11px] hover:bg-white/5"
          onClick={() => setPath(home)}
        >
          Home
        </button>
        <input
          className="flex-1 rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px]"
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-44 shrink-0 overflow-auto border-r border-white/10 bg-[#0a0e1a] py-2">
          <div className="px-3 pb-1 font-mono text-[10px] uppercase tracking-wider text-[#8a9ab5]">
            Quick access
          </div>
          {QUICK_PATHS.map((q) => {
            const target = q.root ?? `${home}\\${q.sub}`
            return (
              <button
                key={q.label}
                type="button"
                onClick={() => setPath(target)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] hover:bg-white/5"
              >
                <IconFolder size={14} className="text-[#5e9bff]" />
                <span className="truncate">{q.label}</span>
              </button>
            )
          })}
        </aside>

        <div className="flex-1 overflow-auto">
          {showingHome ? (
            <table className="w-full border-collapse font-mono text-[11px]">
              <thead className="sticky top-0 z-10 bg-[#0f1824] text-[10px] uppercase text-[#8a9ab5]">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Modified</th>
                  <th className="p-2 text-right">Size</th>
                  <th className="p-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {baselineForHome.map((f) => (
                  <tr
                    key={f.name}
                    className={`border-t border-white/5 ${
                      f.suspicious ? 'bg-red-500/10 text-red-200' : 'hover:bg-white/5'
                    }`}
                    onDoubleClick={() => f.type === 'dir' && setPath(`${path}\\${f.name}`)}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {f.type === 'dir' ? (
                          <IconFolder size={14} className="text-[#5e9bff]" />
                        ) : (
                          <span className="inline-block h-3 w-2 rounded-sm bg-[#a8b6ca]/40" />
                        )}
                        <span>{f.name}</span>
                      </div>
                    </td>
                    <td className="p-2 text-[#a8b6ca]">{fmtTime(f.modified)}</td>
                    <td className="p-2 text-right tabular-nums">{fmtSize(f.sizeKb)}</td>
                    <td className="p-2 text-[10px] text-yellow-200">{f.hint ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <pre className="whitespace-pre-wrap p-3 text-[11px] text-[#a8b6ca]">{vfs.ls(path, [])}</pre>
          )}
        </div>
      </div>
    </div>
  )
}
