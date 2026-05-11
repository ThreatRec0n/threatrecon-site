import { useState } from 'react'
import type { CaseDefinition } from '../../types/case.types'

type Nav =
  | 'system'
  | 'bluetooth'
  | 'network'
  | 'personalization'
  | 'apps'
  | 'accounts'
  | 'time'
  | 'privacy'
  | 'security'
  | 'updates'

export function SettingsApp({ caseDef }: { caseDef: CaseDefinition }) {
  const [nav, setNav] = useState<Nav>('system')

  const hostIp = caseDef.initialAlert.host.includes('.')
    ? '10.50.1.12'
    : '10.50.1.12'

  const row = (navBtn: Nav, icon: string, label: string) => (
    <button
      key={navBtn}
      type="button"
      onClick={() => setNav(navBtn)}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] ${nav === navBtn ? 'bg-white/10 text-white' : 'text-[#ddd] hover:bg-white/6'}`}
    >
      <span className="w-6 text-center">{icon}</span>
      {label}
    </button>
  )

  return (
    <div
      className="flex h-full bg-[#202020] text-[13px] text-[#f3f3f3]"
      style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif" }}
    >
      <aside className="w-56 shrink-0 border-r border-black bg-[#2d2d2d] px-2 py-3">
        <div className="px-2 pb-3 text-[18px] font-semibold">Settings</div>
        {row('system', '⚙', 'System')}
        {row('bluetooth', '📶', 'Bluetooth & devices')}
        {row('network', '🌐', 'Network & internet')}
        {row('personalization', '🎨', 'Personalization')}
        {row('apps', '📦', 'Apps')}
        {row('accounts', '👤', 'Accounts')}
        {row('time', '🕐', 'Time & language')}
        {row('privacy', '🛡', 'Privacy & security')}
        {row('security', '🔒', 'Windows Security')}
        {row('updates', '🔄', 'Windows Update')}
      </aside>
      <div className="min-w-0 flex-1 overflow-auto p-8">
        {nav === 'system' ? (
          <div className="max-w-xl space-y-4">
            <h2 className="text-[22px] font-semibold">System</h2>
            <p className="text-[#bbb]">Display, sound, notifications, power.</p>
            <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <dt className="text-[#aaa]">Device name</dt>
              <dd>ENG-WS-31</dd>
              <dt className="text-[#aaa]">Processor</dt>
              <dd>Intel Core i7-1265U @ 2.40 GHz</dd>
              <dt className="text-[#aaa]">RAM</dt>
              <dd>16 GB</dd>
              <dt className="text-[#aaa]">Edition</dt>
              <dd>Windows 11 Pro — training simulation</dd>
            </dl>
          </div>
        ) : null}
        {nav === 'network' ? (
          <div className="max-w-xl space-y-4">
            <h2 className="text-[22px] font-semibold">Network</h2>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[15px] font-medium text-[#7ecb7e]">Connected — SOC-SECURE-NET</div>
              <div className="mt-2 space-y-1 text-[#ccc]">
                <div>Private network · WPA3-Enterprise</div>
                <div>IPv4: {hostIp}</div>
                <div>DNS: 10.50.1.1</div>
              </div>
            </div>
          </div>
        ) : null}
        {nav === 'security' ? (
          <div className="max-w-xl space-y-4">
            <h2 className="text-[22px] font-semibold">Windows Security</h2>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="font-semibold text-emerald-200">Microsoft Defender Antivirus</div>
              <div className="mt-2 text-[#ccc]">Real-time protection: On (simulated)</div>
              <div className="mt-1 text-[#ccc]">Last scan: Today, 06:12 AM · Quick scan</div>
            </div>
          </div>
        ) : null}
        {nav !== 'system' && nav !== 'network' && nav !== 'security' ? (
          <div>
            <h2 className="text-[22px] font-semibold capitalize">{nav}</h2>
            <p className="mt-3 max-w-lg text-[#999]">
              This page is cosmetic for UX muscle memory — changing toggles does not affect the investigation sandbox.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
