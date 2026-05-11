import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { PhaseTracker } from './PhaseTracker'
import { Timer } from './Timer'
import type { GamePhase } from '../../contexts/GameContext'
import { ReportEditor } from '../../components/ReportEditor/ReportEditor'

const TOOLS = [
  { id: 'terminal', label: 'Terminal' },
  { id: 'proc', label: 'Processes' },
  { id: 'evt', label: 'Event Viewer' },
  { id: 'reg', label: 'Registry' },
  { id: 'net', label: 'Network' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'users', label: 'Users' },
  { id: 'files', label: 'Explorer' },
  { id: 'fw', label: 'Firewall' },
] as const
type ToolId = typeof TOOLS[number]['id']

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
      mitre: [],
      taggedIoc: true,
    })
  }, [caseDef, addEvidence])

  useEffect(() => {
    if (timeUp) {
      setShowReport(true)
    }
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
      const desc = (() => {
        switch (id) {
          case 'terminal':
            return {
              id,
              title: 'Command Prompt',
              defaultRect: { x: 80, y: 60, width: 880, height: 480 },
              render: () => <TerminalWindow createShell={createShell} />,
            }
          case 'proc':
            return {
              id,
              title: 'Process Monitor',
              render: () => <ProcessMonitor caseDef={caseDef} />,
            }
          case 'evt':
            return {
              id,
              title: 'Event Viewer',
              defaultRect: { x: 140, y: 80, width: 920, height: 560 },
              render: () => <EventViewer caseDef={caseDef} />,
            }
          case 'reg':
            return {
              id,
              title: 'Registry Editor',
              render: () => <RegistryEditor registry={registry} />,
            }
          case 'net':
            return {
              id,
              title: 'Network Monitor',
              render: () => (
                <NetworkMonitor caseDef={caseDef} exfilWarned={exfilWarned} exfilBlocked={exfilBlocked} />
              ),
            }
          case 'tasks':
            return { id, title: 'Task Scheduler', render: () => <TaskScheduler caseDef={caseDef} /> }
          case 'users':
            return { id, title: 'Local Users', render: () => <UserAccounts caseDef={caseDef} /> }
          case 'files':
            return { id, title: 'File Explorer', render: () => <FileExplorer /> }
          case 'fw':
            setPhase('harden')
            return { id, title: 'Firewall', render: () => <FirewallConsole /> }
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

          <div className="absolute left-6 top-6 flex flex-col gap-3">
            {TOOLS.map((t) => (
              <DesktopIcon key={t.id} label={t.label} onOpen={() => openTool(t.id)} />
            ))}
          </div>

          <WindowSurface />

          <Taskbar onOpen={openTool} />

          {showAlert ? (
            <div className="pointer-events-auto absolute inset-0 z-[1000] flex items-start justify-center bg-black/60 p-10">
              <div className="max-w-xl rounded-lg border border-yellow-500/40 bg-[#0f1824] p-6 shadow-2xl">
                <div className="font-display text-lg text-yellow-200">SIEM ALERT</div>
                <pre className="mt-4 whitespace-pre-wrap font-mono text-[12px] text-[#e8edf5]">
                  {`Severity: HIGH\nTime: ${caseDef.initialAlert.time}\nHost: ${caseDef.initialAlert.host}\nUser: ${caseDef.initialAlert.user}\nDetail:\n${caseDef.initialAlert.detail}`}
                </pre>
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

function DesktopIcon({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="pointer-events-auto flex w-36 flex-col items-center gap-1 rounded-md border border-transparent px-2 py-2 text-left hover:border-white/10 hover:bg-white/5"
    >
      <div className="h-10 w-10 rounded-md bg-gradient-to-br from-[#1a2436] to-[#0f1824] shadow-inner shadow-black/60" />
      <span className="text-center font-mono text-[11px] text-[#e8edf5] drop-shadow">{label}</span>
    </button>
  )
}

function Taskbar({ onOpen }: { onOpen: (id: ToolId) => void }) {
  const { windows, toggleMinimize, bringToFront } = useWindows()
  return (
    <div className="pointer-events-auto absolute bottom-0 left-0 right-0 z-[900] flex items-center gap-2 border-t border-white/10 bg-[#0a0e1a]/95 px-3 py-2 backdrop-blur">
      <StartOrb />
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="rounded px-2 py-1 font-mono text-[11px] hover:bg-white/5"
          onClick={() => onOpen(t.id)}
        >
          {t.label}
        </button>
      ))}
      <span className="mx-2 h-5 w-px bg-white/10" />
      {windows.map((w) => (
        <button
          key={w.id}
          type="button"
          className={`rounded border px-2 py-1 font-mono text-[10px] ${
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
          {w.title.length > 16 ? `${w.title.slice(0, 14)}…` : w.title}
        </button>
      ))}
      <div className="ml-auto font-mono text-[11px] text-[#8a9ab5]">{new Date().toLocaleTimeString()}</div>
    </div>
  )
}

function StartOrb() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#5e9bff] to-[#2d4aa7] shadow-lg shadow-[#5e9bff]/25">
      <span className="font-display text-xs font-bold text-white">TR</span>
    </div>
  )
}
