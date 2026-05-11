import { useMemo } from 'react'
import type { CaseDefinition, UserAccountDef } from '../../types/case.types'
import { BASELINE_USERS } from '../../data/baselineSystem'

const fmtTime = (t: string) => {
  if (!t || t === 'Never') return 'Never'
  return t.replace('T', ' ').replace('Z', ' UTC')
}

export function UserAccounts({ caseDef }: { caseDef: CaseDefinition }) {
  const users = useMemo<UserAccountDef[]>(() => {
    const seen = new Set(BASELINE_USERS.map((u) => u.name.toLowerCase()))
    const extras = (caseDef.userAccounts ?? []).filter((u) => !seen.has(u.name.toLowerCase()))
    return [...BASELINE_USERS, ...extras]
  }, [caseDef])

  const enabled = users.filter((u) => u.enabled).length
  const malicious = users.filter((u) => u.malicious).length

  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] text-xs text-[#e8edf5]">
      <div className="flex items-center gap-4 border-b border-white/10 bg-[#0f1824] px-3 py-2 font-mono text-[10px]">
        <span className="text-[#8a9ab5]">Local Users</span>
        <span>{users.length}</span>
        <span className="text-[#8a9ab5]">Enabled</span>
        <span className="text-emerald-300">{enabled}</span>
        <span className="text-[#8a9ab5]">Suspicious</span>
        <span className={malicious > 0 ? 'text-red-300' : 'text-[#a8b6ca]'}>{malicious}</span>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {users.map((u) => (
            <article
              key={u.name + u.sid}
              className={`rounded-lg border p-3 font-mono ${
                u.malicious
                  ? 'border-red-500/40 bg-red-500/5'
                  : u.enabled
                  ? 'border-white/10 bg-black/20'
                  : 'border-white/5 bg-black/10 text-[#8a9ab5]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-sm uppercase tracking-wide text-[#e8edf5]">
                    {u.name}
                  </div>
                  {u.fullName ? (
                    <div className="mt-0.5 text-[11px] text-[#a8b6ca]">{u.fullName}</div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  {u.malicious ? (
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-red-200">SUSPECT</span>
                  ) : null}
                  <span
                    className={`rounded px-2 py-0.5 ${
                      u.enabled
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-white/5 text-[#8a9ab5]'
                    }`}
                  >
                    {u.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
              {u.description ? (
                <p className="mt-2 text-[11px] text-[#a8b6ca]">{u.description}</p>
              ) : null}
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <dt className="text-[#8a9ab5]">Last logon</dt>
                <dd>{fmtTime(u.lastLogon)}</dd>
                <dt className="text-[#8a9ab5]">Password age</dt>
                <dd>{u.passwordAge}</dd>
                <dt className="text-[#8a9ab5]">Created</dt>
                <dd>{fmtTime(u.created)}</dd>
                <dt className="text-[#8a9ab5]">SID</dt>
                <dd className="truncate text-[#a8b6ca]">{u.sid}</dd>
                <dt className="text-[#8a9ab5]">Groups</dt>
                <dd className="col-span-2 text-[#5e9bff]">
                  {u.groups.length ? u.groups.join(', ') : '(none)'}
                </dd>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
