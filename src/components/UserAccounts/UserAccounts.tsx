import type { CaseDefinition } from '../../types/case.types'

export function UserAccounts({ caseDef }: { caseDef: CaseDefinition }) {
  return (
    <div className="h-full overflow-auto bg-[#0a0e1a] p-3 text-xs font-mono">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-[#0f1824] text-[11px] uppercase text-[#8a9ab5]">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Groups</th>
            <th className="p-2 text-left">Last logon</th>
          </tr>
        </thead>
        <tbody>
          {caseDef.userAccounts.map((u) => (
            <tr key={u.name} className={`border-t border-white/5 ${u.malicious ? 'bg-yellow-500/10' : ''}`}>
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.groups.join(', ')}</td>
              <td className="p-2">{u.lastLogon}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
