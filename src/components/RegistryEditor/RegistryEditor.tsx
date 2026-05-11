import { useEffect, useMemo, useState } from 'react'
import type { VirtualRegistry, RegistryNode } from '../../engine/VirtualRegistry'

interface TreeRow {
  path: string
  depth: number
  expandable: boolean
}

const PERSISTENCE_PATTERNS = [
  /\\Run$/i,
  /\\RunOnce$/i,
  /\\Image File Execution Options\\/i,
  /\\AppInit_DLLs/i,
  /\\Winlogon$/i,
]

const isPersistencePath = (p: string) => PERSISTENCE_PATTERNS.some((re) => re.test(p))

export function RegistryEditor({ registry }: { registry: VirtualRegistry }) {
  const hives = useMemo(() => registry.hives(), [registry])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(hives))
  const [selected, setSelected] = useState<string>(hives[0] ?? '')
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!selected && hives[0]) setSelected(hives[0])
  }, [hives, selected])

  const rows = useMemo(() => buildRows(registry, expanded), [registry, expanded])
  const node: RegistryNode | null = registry.getNode(selected)
  const values = node ? [...node.values.values()] : []
  const isPersistence = isPersistencePath(selected)

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const n = new Set(prev)
      if (n.has(path)) n.delete(path)
      else n.add(path)
      return n
    })
  }

  return (
    <div className="flex h-full bg-[#0a0e1a] text-xs text-[#e8edf5]">
      <div className="w-2/5 overflow-auto border-r border-white/10">
        <div className="border-b border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#8a9ab5]">
          Computer
        </div>
        <ul className="font-mono text-[11px]">
          {rows.map((r) => {
            const persistence = isPersistencePath(r.path)
            return (
              <li
                key={r.path}
                className={`flex cursor-pointer items-center gap-1 px-2 py-0.5 hover:bg-white/5 ${
                  r.path === selected ? 'bg-[#5e9bff]/15 text-white' : 'text-[#c8d6e8]'
                } ${persistence ? 'text-yellow-200' : ''}`}
                style={{ paddingLeft: 8 + r.depth * 14 }}
                onClick={() => setSelected(r.path)}
                onDoubleClick={() => toggle(r.path)}
              >
                {r.expandable ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(r.path)
                    }}
                    className="text-[#5e9bff]"
                  >
                    {expanded.has(r.path) ? '▼' : '▶'}
                  </button>
                ) : (
                  <span className="w-3" />
                )}
                <span className="truncate">{r.path.split('\\').pop()}</span>
                {persistence ? (
                  <span className="ml-auto pr-1 text-[9px] uppercase tracking-wider text-yellow-300/70">
                    persist
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 font-mono text-[11px]">
          <span className="text-[#8a9ab5]">{selected}</span>
          {isPersistence ? (
            <span className="rounded bg-yellow-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-yellow-200">
              persistence key
            </span>
          ) : null}
        </div>
        <div className="flex-1 overflow-auto p-2 font-mono">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-[#0f1824] text-[11px] uppercase text-[#8a9ab5]">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Data</th>
              </tr>
            </thead>
            <tbody>
              {values.length === 0 ? (
                <tr>
                  <td className="p-2 text-[#4a566b]" colSpan={3}>
                    (No values in this key)
                  </td>
                </tr>
              ) : (
                values.map((v) => {
                  const looksSus =
                    isPersistence &&
                    /\\AppData\\|\\Temp\\|\\ProgramData\\|powershell\.exe.*-(enc|nop|w hidden)/i.test(
                      v.data,
                    )
                  return (
                    <tr
                      key={v.name}
                      className={`border-t border-white/5 ${
                        looksSus ? 'bg-red-500/10 text-red-200' : ''
                      }`}
                    >
                      <td className="p-2">{v.name === '' ? '(Default)' : v.name}</td>
                      <td className="p-2 text-[#8a9ab5]">{v.type}</td>
                      <td className="p-2 break-all">{v.data}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2 text-[10px] text-[#8a9ab5]">
          <button
            type="button"
            className="rounded border border-white/10 px-2 py-1 hover:bg-white/5"
            onClick={() => {
              if (!selected) return
              registry.exportReg(selected)
              setTick((t) => t + 1)
            }}
          >
            Export key (forensic-safe)
          </button>
          <span>{registry.isExported(selected) ? '✓ Exported' : 'Not yet exported'}</span>
        </div>
      </div>
    </div>
  )
}

function buildRows(registry: VirtualRegistry, expanded: Set<string>): TreeRow[] {
  const rows: TreeRow[] = []
  const recurse = (path: string, depth: number) => {
    const subkeys = registry.listSubkeys(path)
    const expandable = subkeys.length > 0
    rows.push({ path, depth, expandable })
    if (expanded.has(path)) {
      for (const sk of subkeys) recurse(`${path}\\${sk}`, depth + 1)
    }
  }
  for (const hive of registry.hives()) recurse(hive, 0)
  return rows
}
