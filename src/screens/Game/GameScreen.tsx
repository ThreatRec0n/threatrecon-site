import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../../contexts/GameContext'
import { useEvidence } from '../../contexts/EvidenceContext'
import { usePlayer } from '../../contexts/PlayerContext'
import { EvidenceLocker } from '../../components/EvidenceLocker/EvidenceLocker'
import { TerminalWindow } from '../../components/Terminal/Terminal'
import { ProcessMonitor } from '../../components/ProcessMonitor/ProcessMonitor'
import { EventViewer } from '../../components/EventViewer/EventViewer'
import { RegistryEditor } from '../../components/RegistryEditor/RegistryEditor'
import { NetworkMonitor } from '../../components/NetworkMonitor/NetworkMonitor'
import { TaskScheduler } from '../../components/TaskScheduler/TaskScheduler'
import { UserAccounts } from '../../components/UserAccounts/UserAccounts'
import { FileExplorer } from '../../components/FileExplorer/FileExplorer'
import { FirewallConsole } from '../../components/FirewallConsole/FirewallConsole'
import { WindowManagerProvider, useWindows } from '../../components/WindowManager/WindowManager'
import { WindowSurface } from '../../components/WindowManager/FloatingWindow'
import {
  IconTerminal,
  IconCpu,
  IconList,
  IconDatabase,
  IconNetwork,
  IconClock,
  IconUsers,
  IconFolder,
  IconShield,
} from '../../components/shared/Icons'
import { PhaseTracker } from './PhaseTracker'
import { Timer } from './Timer'
import type { GamePhase } from '../../contexts/GameContext'
import { ReportEditor } from '../../components/ReportEditor/ReportEditor'

interface ToolDef {
  id: string
  label: string
  Icon: ComponentType<{ size?: number; className?: string }>
}

const TOOLS: ToolDef[] = [
  { id: 'terminal', label: 'Terminal', Icon: IconTerminal },
  { id: 'proc', label: 'Processes', Icon: IconCpu },
  { id: 'evt', label: 'Event Viewer', Icon: IconList },
  { id: 'reg', label: 'Registry', Icon: IconDatabase },
  { id: 'net', label: 'Network', Icon: IconNetwork },
  { id: 'tasks', label: 'Tasks', Icon: IconClock },
  { id: 'users', label: 'Users', Icon: IconUsers },
  { id: 'files', label: 'Explorer', Icon: IconFolder },
  { id: 'fw', label: 'Firewall', Icon: IconShield },
] as const

type ToolId = (typeof TOOLS)[number]['id']

export function GameScreen() {
  return (
    <WindowManagerProvider>
      <GameScreenInner />
    </WindowManagerProvider>
  )
}

function GameScreenInner() {
  const navigate = useNavigate()
  const { profile } = usePlayer()
  const { addEvidence, reset: resetEvidence } = useEvidence()
  const game = useGame()
  const {
    caseDef,
    phase,
    setPhase,
    timerRemaining,
    timerTotal,
    createShell,
    markToolsOpened,
    timeUp,
    difficulty,
    toolsOpened,
    hardeningDone,
    registry,
    exfilProgress,
    exfilWarned,
    exfilBlocked,
  } = game

  const winMgr = useWindows()
  const [showAlert, setShowAlert] = useState(true)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    resetEvidence()
  }, [caseDef?.caseId, resetEvidence])

  useEffect(() => {
    if (!caseDef) return
    addEvidence({
      timestamp: new Date().toISOString(),
      type: 'NETWORK',
      title: caseDef.initialAlert.title,
      path: caseDef.initialAlert.detail,
      notes: 'Auto-captured opening alert.',
      mitre: caseDef.entryVector ? [caseDef.entryVector.id] : [],
      taggedIoc: true,
    })
  }, [caseDef, addEvidence])

  useEffect(() => {
    if (timeUp) setShowReport(true)
  }, [timeUp])

  const completed = useMemo(() => {
    const map: Record<GamePhase, boolean> = {
      detect: toolsOpened || phase !== 'detect',
      hunt: phase !== 'detect' && phase !== 'hunt',
      eradicate: phase === 'harden' || phase === 'report',
      harden: phase === 'report',
      report: false,
    }
    return map
  }, [phase, toolsOpened])

  const openTool = useCallback(
    (id: ToolId) => {
      if (!caseDef || !registry) return
      markToolsOpened()
      const tool = TOOLS.find((t) => t.id === id)
      const icon = tool ? <tool.Icon size={14} className="text-[#5e9bff]" /> : null
      const desc = (() => {
        switch (id) {
          case 'terminal':
            return {
              id,
              title: 'Command Prompt',
              icon,
              defaultRect: { x: 80, y: 60, width: 920, height: 520 },
              render: () => (
                <TerminalWindow
                  createShell={createShell}
                  initialBanner={buildInitialBanner(caseDef.hostname, caseDef.primaryUser)}
                />
              ),
            }
          case 'proc':
            return { id, title: 'Process Monitor', icon, render: () => <ProcessMonitor caseDef={caseDef} /> }
          case 'evt':
            return {
              id,
              title: 'Event Viewer',
              icon,
              defaultRect: { x: 140, y: 80, width: 960, height: 600 },
              render: () => <EventViewer caseDef={caseDef} />,
            }
          case 'reg':
            return { id, title: 'Registry Editor', icon, render: () => <RegistryEditor registry={registry} /> }
          case 'net':
            return {
              id,
              title: 'Network Monitor',
              icon,
              render: () => (
                <NetworkMonitor caseDef={caseDef} exfilWarned={exfilWarned} exfilBlocked={exfilBlocked} />
              ),
            }
          case 'tasks':
            return { id, title: 'Task Scheduler', icon, render: () => <TaskScheduler caseDef={caseDef} /> }
          case 'users':
            return { id, title: 'Local Users', icon, render: () => <UserAccounts caseDef={caseDef} /> }
          case 'files':
            return { id, title: 'File Explorer', icon, render: () => <FileExplorer /> }
          case 'fw':
            setPhase('harden')
            return { id, title: 'Firewall', icon, defaultRect: { x: 140, y: 70, width: 1000, height: 620 }, render: () => <FirewallConsole /> }
          default:
            return null
        }
      })()
      if (desc) winMgr.open(desc)
    },
    [caseDef, registry, createShell, markToolsOpened, setPhase, winMgr, exfilWarned, exfilBlocked],
  )

  /* auto-open terminal once on case start */
  useEffect(() => {
    if (caseDef) openTool('terminal')
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [caseDef?.caseId])

  if (!caseDef || !difficulty) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060a12] text-[#e8edf5]">
        No active case.{' '}
        <button type="button" className="ml-3 underline" onClick={() => navigate('/')}>
          Return
        </button>
      </div>
    )
  }

  const hardeningPct =
    (Object.keys(hardeningDone).filter((k) => hardeningDone[k]).length /
      Math.max(1, caseDef.correctHardeningSteps.length)) *
    100

  return (
    <div className="flex h-screen max-h-screen flex-col bg-[#060a12] text-[#e8edf5]">
      <PhaseTracker phase={phase} completed={completed} />
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-2 font-mono text-[11px] text-[#8a9ab5]">
        <div className="flex items-center gap-4">
          <span>{caseDef.hostname}</span>
          <span className="text-white/40">|</span>
          <span>{profile.name}</span>
          <span className="text-white/40">|</span>
          <span className="uppercase">{difficulty.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-6">
          {exfilWarned && !exfilBlocked ? (
            <div className="flex items-center gap-2 rounded border border-red-500/40 bg-red-500/10 px-3 py-1 text-[10px] text-red-200">
              EXFIL
              <div className="h-1 w-24 overflow-hidden rounded-full bg-black/40">
                <div className="h-full bg-red-400 transition-all" style={{ width: `${Math.round(exfilProgress * 100)}%` }} />
              </div>
              <span>{Math.round(exfilProgress * 100)}%</span>
            </div>
          ) : null}
          {exfilBlocked ? (
            <div className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-200">
              EXFIL BLOCKED
            </div>
          ) : null}
          <Timer seconds={timerRemaining} totalSeconds={timerTotal} />
          <button
            type="button"
            className="rounded border border-white/10 px-3 py-1 text-[11px] hover:bg-white/5"
            onClick={() => setShowReport(true)}
          >
            Incident Report
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <section
          id="tr-desktop"
          className="relative min-w-0 flex-1 overflow-hidden bg-gradient-to-br from-[#060a12] via-[#0a1422] to-[#060a12]"
        >
          <div className="pointer-events-none absolute inset-0 opacity-30 grid-bg" />
          <div className="pointer-events-none absolute inset-0 scanline" />

          <div className="pointer-events-none absolute bottom-24 left-10 select-none font-display text-6xl font-bold uppercase text-white/[0.03]">
            {caseDef.industry.companyName}
          </div>

          {/* Desktop icons grid (top-left) */}
          <div className="absolute left-6 top-6 grid grid-cols-2 gap-x-2 gap-y-3">
            {TOOLS.map((t) => (
              <DesktopIcon key={t.id} label={t.label} Icon={t.Icon} onOpen={() => openTool(t.id)} />
            ))}
          </div>

          <WindowSurface />

          <Taskbar onOpen={openTool} />

          {showAlert ? (
            <div className="pointer-events-auto absolute inset-0 z-[1000] flex items-start justify-center bg-black/60 p-10">
              <div className="max-w-xl rounded-lg border border-yellow-500/40 bg-[#0f1824] p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="font-display text-lg text-yellow-200">SIEM ALERT</div>
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
                      caseDef.severity === 'CRITICAL' || caseDef.severity === 'HIGH'
                        ? 'border-red-500/40 bg-red-500/15 text-red-200'
                        : 'border-yellow-500/40 bg-yellow-500/15 text-yellow-200'
                    }`}
                  >
                    {caseDef.severity}
                  </span>
                </div>
                <pre className="mt-4 whitespace-pre-wrap font-mono text-[12px] text-[#e8edf5]">
                  {`Time:   ${caseDef.initialAlert.time}\nHost:   ${caseDef.initialAlert.host}\nUser:   ${caseDef.initialAlert.user}\nActor:  ${caseDef.threatActor.displayName}\n\n${caseDef.initialAlert.title}\n${caseDef.initialAlert.detail}`}
                </pre>
                {caseDef.entryVector ? (
                  <div className="mt-4 flex flex-wrap gap-1">
                    <span className="rounded bg-[#5e9bff]/15 px-2 py-0.5 font-mono text-[10px] uppercase text-[#5e9bff]">
                      {caseDef.entryVector.id}
                    </span>
                    <span className="rounded bg-[#5e9bff]/10 px-2 py-0.5 font-mono text-[10px] text-[#a8b6ca]">
                      {caseDef.entryVector.name}
                    </span>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="mt-6 w-full rounded bg-[#5e9bff] px-4 py-2 font-mono text-sm text-[#060a12]"
                  onClick={() => setShowAlert(false)}
                >
                  ACKNOWLEDGE
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <EvidenceLocker />
      </div>

      {showReport ? (
        <ReportEditor hardeningPct={hardeningPct} onClose={() => setShowReport(false)} forceSubmit={timeUp} />
      ) : null}
    </div>
  )
}

function DesktopIcon({
  label,
  Icon,
  onOpen,
}: {
  label: string
  Icon: ComponentType<{ size?: number; className?: string }>
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onDoubleClick={onOpen}
      onClick={(e) => {
        if (e.detail === 1) {
          /* visual single-click highlight only; double-click triggers open */
        }
      }}
      title={`Double-click to open ${label}`}
      className="group pointer-events-auto flex w-24 flex-col items-center gap-1 rounded-md border border-transparent px-2 py-2 text-left hover:border-white/15 hover:bg-white/5 focus:border-[#5e9bff]/60 focus:bg-[#5e9bff]/10 focus:outline-none"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-gradient-to-br from-[#1a2436] to-[#0f1824] shadow-inner shadow-black/60 group-hover:border-[#5e9bff]/50">
        <Icon size={24} className="text-[#5e9bff]" />
      </div>
      <span className="w-full truncate text-center font-mono text-[10px] text-[#e8edf5] drop-shadow">
        {label}
      </span>
    </button>
  )
}

function Taskbar({ onOpen }: { onOpen: (id: ToolId) => void }) {
  const { windows, toggleMinimize, bringToFront } = useWindows()
  return (
    <div className="pointer-events-auto absolute bottom-0 left-0 right-0 z-[900] flex items-center gap-1 border-t border-white/10 bg-[#0a0e1a]/95 px-2 py-1.5 backdrop-blur">
      <StartOrb />
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="flex items-center gap-1.5 rounded px-2 py-1 font-mono text-[10px] text-[#a8b6ca] hover:bg-white/5"
          onClick={() => onOpen(t.id)}
          title={`Open ${t.label}`}
        >
          <t.Icon size={14} className="text-[#5e9bff]" />
          <span>{t.label}</span>
        </button>
      ))}
      <span className="mx-2 h-5 w-px bg-white/10" />
      {windows.map((w) => {
        const tool = TOOLS.find((t) => t.id === w.id)
        return (
          <button
            key={w.id}
            type="button"
            className={`flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[10px] ${
              w.minimized
                ? 'border-white/10 text-[#8a9ab5] hover:bg-white/5'
                : 'border-[#5e9bff]/40 bg-[#5e9bff]/10 text-[#5e9bff]'
            }`}
            onClick={() => {
              if (w.minimized) bringToFront(w.id)
              else toggleMinimize(w.id)
            }}
            title={w.title}
          >
            {tool ? <tool.Icon size={12} /> : null}
            <span>{w.title.length > 14 ? `${w.title.slice(0, 12)}…` : w.title}</span>
          </button>
        )
      })}
      <div className="ml-auto font-mono text-[10px] text-[#8a9ab5]">
        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}

/** A realistic header that mimics what an analyst already saw in the shell session. */
function buildInitialBanner(hostname: string, user: string): string {
  return [
    `Microsoft Windows [Version 10.0.22621.3593]`,
    `(c) Microsoft Corporation. All rights reserved.`,
    ``,
    `C:\\Users\\${user}> hostname`,
    hostname,
    ``,
    `C:\\Users\\${user}> whoami`,
    `corp\\${user}`,
    ``,
    `C:\\Users\\${user}> ipconfig | findstr IPv4`,
    `   IPv4 Address. . . . . . . . . . . : 10.0.1.5`,
    ``,
    `C:\\Users\\${user}> netstat -ano | findstr ESTABLISHED | findstr :443`,
    `  TCP    10.0.1.5:49231         52.96.165.34:443       ESTABLISHED     6188`,
    `  TCP    10.0.1.5:49445         142.250.80.46:443      ESTABLISHED     5040`,
    `  TCP    10.0.1.5:49502         52.114.128.74:443      ESTABLISHED     4528`,
    ``,
    `C:\\Users\\${user}> dir /b %TEMP%`,
    `chrome_drvr_install.log`,
    `MicrosoftEdgeUpdate.log`,
    `(scrolled — see File Explorer)`,
    ``,
    `[ session attached — type 'help' for command list ]`,
    ``,
  ].join('\n')
}

function StartOrb() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#5e9bff] to-[#2d4aa7] shadow-lg shadow-[#5e9bff]/25">
      <span className="font-display text-xs font-bold text-white">TR</span>
    </div>
  )
}
