import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGame } from '../../contexts/GameContext'
import { useScoringRuntime } from '../../contexts/ScoringRuntimeContext'
import {
  baselineFiles,
  baselineRoamingFiles,
  baselineAppDataDirs,
  type BaselineFile,
} from '../../data/baselineSystem'
import { IconAlert, IconFolder } from '../shared/Icons'

const fmtTime = (t: string) => t.replace('T', ' ').replace('Z', ' UTC')
const fmtSize = (kb?: number) => {
  if (kb === undefined) return ''
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb.toLocaleString()} KB`
}

function norm(p: string) {
  return p.replace(/\//g, '\\').replace(/\\+$/, '')
}

/** Parent folder for Windows paths (e.g. C:\\Users\\x → C:\\Users); root → null */
function parentOf(p: string): string | null {
  const n = norm(p)
  const m = n.match(/^([a-zA-Z]:\\)(.*)$/i)
  if (!m) return null
  const tail = m[2]
  if (!tail) return null
  const segs = tail.split('\\').filter(Boolean)
  segs.pop()
  return segs.length ? `${m[1]}${segs.join('\\')}` : m[1]
}

const ROOT_C_ENTRIES: BaselineFile[] = [
  { name: 'Program Files', type: 'dir', modified: '2026-01-08T08:00:00Z' },
  { name: 'Program Files (x86)', type: 'dir', modified: '2026-01-08T08:00:00Z' },
  { name: 'Users', type: 'dir', modified: '2026-01-08T08:00:00Z' },
  { name: 'Windows', type: 'dir', modified: '2026-01-08T08:00:00Z' },
]

export function FileExplorer() {
  const { vfs, caseDef, recordOperativeMilestone } = useGame()
  const { addScoringEvent } = useScoringRuntime()
  const home = caseDef ? `C:\\Users\\${caseDef.primaryUser}` : 'C:\\'
  const [path, setPath] = useState<string>(() => norm(vfs?.getCurrentPath() ?? home))
  const [navHist, setNavHist] = useState<{ stack: string[]; i: number }>(() => ({
    stack: [norm(vfs?.getCurrentPath() ?? home)],
    i: 0,
  }))
  const [showHidden, setShowHidden] = useState(false)
  const [sortKey, setSortKey] = useState<'name' | 'modified' | 'size'>('name')
  const [ctx, setCtx] = useState<{ x: number; y: number; file?: BaselineFile } | null>(null)
  const [propsFor, setPropsFor] = useState<BaselineFile | null>(null)

  useEffect(() => {
    if (propsFor?.name?.toLowerCase() === 'msupdate.exe') recordOperativeMilestone('investigationMsupdateExplorer')
  }, [propsFor, recordOperativeMilestone])

  const baselineForHome = useMemo<BaselineFile[]>(() => {
    if (!caseDef) return []
    return baselineFiles(caseDef.primaryUser)
  }, [caseDef])

  const listing = useMemo((): BaselineFile[] => {
    if (!caseDef) return [] as BaselineFile[]
    const p = norm(path).toLowerCase()
    const h = norm(home).toLowerCase()

    if (p === 'c:\\') return ROOT_C_ENTRIES
    if (p === 'c:\\users') {
      return [{ name: caseDef.primaryUser, type: 'dir', modified: '2026-05-07T12:00:00Z' }]
    }
    if (p === h) return baselineForHome
    if (p === `${h}\\appdata`) return baselineAppDataDirs()
    if (p === `${h}\\appdata\\roaming`) return baselineRoamingFiles()
    if (p === `${h}\\desktop` || p === `${h}\\documents` || p === `${h}\\downloads`) {
      return [{ name: 'desktop.ini', type: 'file', sizeKb: 2, modified: '2026-05-01T09:00:00Z' }]
    }

    if (vfs) {
      const raw = vfs.ls(path, [])
      if (!raw.includes('File Not Found')) {
        return [{ name: 'Listing truncated — use shell dir', type: 'file', sizeKb: 0, modified: '', hint: raw.slice(0, 500) }]
      }
    }
    return []
  }, [path, home, caseDef, vfs, baselineForHome])

  const visibleList = useMemo(() => {
    let rows = listing.slice()
    if (!showHidden) rows = rows.filter((r) => !r.name.startsWith('.'))
    rows.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      switch (sortKey) {
        case 'modified':
          return (b.modified ?? '').localeCompare(a.modified ?? '')
        case 'size':
          return (b.sizeKb ?? 0) - (a.sizeKb ?? 0)
        default:
          return a.name.localeCompare(b.name)
      }
    })
    return rows
  }, [listing, showHidden, sortKey])

  useEffect(() => {
    if (!caseDef) return
    const roaming = `${norm(home)}\\AppData\\Roaming`.toLowerCase()
    if (norm(path).toLowerCase() !== roaming) return
    if (listing.some((f) => f.name.toLowerCase() === 'msupdate.exe')) {
      addScoringEvent('FILE_FOUND')
    }
  }, [path, listing, caseDef, home, addScoringEvent])

  const navigateTo = useCallback((target: string) => {
    const t = norm(target)
    setNavHist((h) => {
      const stack = h.stack.slice(0, h.i + 1)
      if (stack[stack.length - 1] === t) return h
      stack.push(t)
      return { stack, i: stack.length - 1 }
    })
    setPath(t)
    setCtx(null)
  }, [])

  const goBack = useCallback(() => {
    setNavHist((h) => {
      if (h.i <= 0) return h
      const i = h.i - 1
      setPath(h.stack[i])
      return { ...h, i }
    })
  }, [])

  const goForward = useCallback(() => {
    setNavHist((h) => {
      if (h.i >= h.stack.length - 1) return h
      const i = h.i + 1
      setPath(h.stack[i])
      return { ...h, i }
    })
  }, [])

  const goUp = useCallback(() => {
    const parent = parentOf(path)
    if (parent) navigateTo(parent)
  }, [path, navigateTo])

  const openChild = useCallback(
    (f: BaselineFile) => {
      if (f.type !== 'dir') return
      navigateTo(`${norm(path)}\\${f.name}`)
    },
    [navigateTo, path],
  )

  const QUICK = useMemo(
    () =>
      [
        { label: 'Desktop', t: `${home}\\Desktop` },
        { label: 'Downloads', t: `${home}\\Downloads` },
        { label: 'Documents', t: `${home}\\Documents` },
        { label: 'Pictures', t: `${home}\\Pictures` },
        { label: 'This PC', t: 'C:\\' },
        { label: 'Profile', t: home },
      ] as const,
    [home],
  )

  if (!vfs || !caseDef) return null

  const suspiciousWarn = (f: BaselineFile) =>
    f.suspicious ? (
      <span className="ml-2 inline-flex items-center gap-1 rounded bg-red-500/25 px-1.5 py-0.5 text-[10px] text-red-200">
        ⚠ Suspicious
      </span>
    ) : null

  return (
    <div
      className="flex h-full flex-col bg-[#202020] text-[12px] text-[#f3f3f3]"
      style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif" }}
      onClick={() => setCtx(null)}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-black bg-[#f3f3f3] px-2 py-1 text-[#1f1f1f]">
        <button type="button" title="Back" className="rounded px-2 py-1 hover:bg-black/8 disabled:opacity-35" disabled={navHist.i <= 0} onClick={goBack}>
          ←
        </button>
        <button
          type="button"
          title="Forward"
          className="rounded px-2 py-1 hover:bg-black/8 disabled:opacity-35"
          disabled={navHist.i >= navHist.stack.length - 1}
          onClick={goForward}
        >
          →
        </button>
        <button type="button" title="Up" className="rounded px-2 py-1 hover:bg-black/8 disabled:opacity-35" disabled={!parentOf(path)} onClick={goUp}>
          ↑
        </button>
        <button type="button" title="Home" className="rounded px-2 py-1 hover:bg-black/8" onClick={() => navigateTo(home)}>
          🏠
        </button>
        <input
          className="min-w-[180px] flex-1 rounded border border-black/15 bg-white px-2 py-1 font-mono text-[11px]"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigateTo(norm(path))
          }}
        />
        <input placeholder="Search…" className="w-40 rounded border border-black/15 bg-white px-2 py-1 text-[11px]" disabled />
        <label className="ml-auto flex items-center gap-1 text-[11px]">
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
          Hidden
        </label>
      </div>

      <div className="flex shrink-0 gap-2 border-b border-black bg-[#fafafa] px-3 py-2 text-[11px] text-[#222]">
        <button type="button" className="rounded px-2 py-1 hover:bg-black/6">
          New folder
        </button>
        <button type="button" className="rounded px-2 py-1 hover:bg-black/6">
          Cut
        </button>
        <button type="button" className="rounded px-2 py-1 hover:bg-black/6">
          Copy
        </button>
        <button type="button" className="rounded px-2 py-1 hover:bg-black/6">
          Paste
        </button>
        <button type="button" className="rounded px-2 py-1 hover:bg-black/6">
          Delete
        </button>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)} className="rounded border px-1">
          <option value="name">Sort: Name</option>
          <option value="modified">Sort: Modified</option>
          <option value="size">Sort: Size</option>
        </select>
        <select className="rounded border px-1" defaultValue="details">
          <option value="icons">Icons</option>
          <option value="list">List</option>
          <option value="details">Details</option>
        </select>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-48 shrink-0 overflow-auto border-r border-black bg-[#f7f7f7] py-2 text-[#111]">
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#666]">Quick access</div>
          {QUICK.map((q) => (
            <button
              key={q.t}
              type="button"
              onClick={() => navigateTo(q.t)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-black/[0.06]"
            >
              <IconFolder size={14} className="text-[#eab308]" />
              <span className="truncate">{q.label}</span>
            </button>
          ))}
          <div className="mt-3 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#666]">This PC</div>
          <button type="button" className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-black/[0.06]" onClick={() => navigateTo('C:\\')}>
            <IconFolder size={14} className="text-[#eab308]" />
            Local Disk (C:)
          </button>
        </aside>

        <div className="min-h-0 flex-1 overflow-auto bg-white text-[#111]">
          <table className="w-full border-collapse text-[12px]">
            <thead className="sticky top-0 z-10 bg-[#f3f3f3] text-[11px] uppercase text-[#555]">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Date modified</th>
                <th className="p-2 text-right">Size</th>
                <th className="p-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {visibleList.map((f) => (
                <tr
                  key={f.name}
                  className={`cursor-default border-t border-black/8 ${f.suspicious ? 'bg-red-50 text-red-900' : 'hover:bg-[#eef6ff]'}`}
                  onDoubleClick={() => openChild(f)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCtx({ x: e.clientX, y: e.clientY, file: f })
                  }}
                >
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {f.type === 'dir' ? (
                        <IconFolder size={16} className="text-[#eab308]" />
                      ) : f.suspicious ? (
                        <IconAlert size={16} className="text-red-600" />
                      ) : (
                        <span className="inline-block h-4 w-4 rounded-sm bg-[#a8b6ca]/60" />
                      )}
                      <span>
                        {f.name}
                        {suspiciousWarn(f)}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-[#555]">{f.modified ? fmtTime(f.modified) : ''}</td>
                  <td className="p-2 text-right tabular-nums">{fmtSize(f.sizeKb)}</td>
                  <td className="max-w-md p-2 text-[11px] text-[#666]">{f.hint ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex shrink-0 justify-between border-t border-black bg-[#f7f7f7] px-3 py-1 text-[11px] text-[#444]">
        <span>{visibleList.length} items</span>
        <span>{path}</span>
      </footer>

      {ctx?.file ? (
        <div
          className="fixed z-[1700] min-w-[200px] rounded-xl border border-black/12 bg-white py-1 text-[12px] text-[#111] shadow-2xl"
          style={{ left: ctx.x, top: ctx.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="block w-full px-4 py-2 text-left hover:bg-black/[0.06]" onClick={() => setCtx(null)}>
            Open
          </button>
          <button type="button" className="block w-full px-4 py-2 text-left hover:bg-black/[0.06]">
            Cut
          </button>
          <button type="button" className="block w-full px-4 py-2 text-left hover:bg-black/[0.06]">
            Copy
          </button>
          <button type="button" className="block w-full px-4 py-2 text-left hover:bg-black/[0.06]">
            Delete
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left hover:bg-black/[0.06]"
            onClick={() => {
              setPropsFor(ctx.file ?? null)
              setCtx(null)
            }}
          >
            Properties
          </button>
        </div>
      ) : null}

      {propsFor?.name === 'msupdate.exe' ? (
        <>
          <button type="button" className="fixed inset-0 z-[1800] bg-black/40" onClick={() => setPropsFor(null)} aria-hidden />
          <div className="fixed left-1/2 top-1/2 z-[1810] w-[min(400px,94vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-black/15 bg-white p-5 shadow-2xl">
            <div className="text-[15px] font-semibold">msupdate.exe Properties</div>
            <dl className="mt-4 grid grid-cols-[120px_1fr] gap-y-2 text-[12px]">
              <dt className="text-[#666]">Type</dt>
              <dd>Application</dd>
              <dt className="text-[#666]">Size</dt>
              <dd>847 KB</dd>
              <dt className="text-[#666]">Created</dt>
              <dd>Wednesday, May 1, 2026, 4:12 AM</dd>
              <dt className="text-[#666]">Modified</dt>
              <dd>Thursday, May 8, 2026, 2:58 AM</dd>
              <dt className="text-[#666]">Digital signature</dt>
              <dd className="font-semibold text-red-600">UNVERIFIED</dd>
              <dt className="text-[#666]">Location</dt>
              <dd className="break-all font-mono text-[11px]">{home}\\AppData\\Roaming</dd>
            </dl>
            <button type="button" className="mt-6 w-full rounded bg-[#0078d4] py-2 text-white" onClick={() => setPropsFor(null)}>
              OK
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
