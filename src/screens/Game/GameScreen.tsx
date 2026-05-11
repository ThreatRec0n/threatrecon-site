import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../../contexts/GameContext'
import { useEvidence } from '../../contexts/EvidenceContext'
import { usePlayer } from '../../contexts/PlayerContext'
import { TimelineProvider, useTimeline } from '../../contexts/TimelineContext'
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
import { IncidentTimeline } from '../../components/IncidentTimeline/IncidentTimeline'
import { SiemToastHost } from '../../components/SiemToastHost/SiemToastHost'
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
  IconTimeline,
  IconComputer,
  IconRecycle,
  IconDocuments,
  IconWindowsLogo,
  IconWifi,
  IconVolume,
  IconSearch,
} from '../../components/shared/Icons'
import { PhaseTracker } from './PhaseTracker'
import { Timer } from './Timer'
import type { GamePhase } from '../../contexts/GameContext'
import { ReportEditor } from '../../components/ReportEditor/ReportEditor'

interface ToolDef {
  id: string
  label: string
  Icon: ComponentType<{ size?: number; className?: string }>
  pinned?: boolean
}

const TOOLS: ToolDef[] = [
  { id: 'terminal', label: 'Terminal', Icon: IconTerminal, pinned: true },
  { id: 'proc', label: 'Processes', Icon: IconCpu, pinned: true },
  { id: 'evt', label: 'Event Viewer', Icon: IconList, pinned: true },
  { id: 'reg', label: 'Registry', Icon: IconDatabase, pinned: true },
  { id: 'net', label: 'Network Monitor', Icon: IconNetwork },
  { id: 'tasks', label: 'Tasks', Icon: IconClock },
  { id: 'users', label: 'Users', Icon: IconUsers },
  { id: 'files', label: 'Explorer', Icon: IconFolder },
  { id: 'fw', label: 'Firewall', Icon: IconShield },
  { id: 'timeline', label: 'Timeline', Icon: IconTimeline },
] as const

type ToolId = (typeof TOOLS)[number]['id']

const SYSTEM_ICONS: {
  id: string
  label: string
  Icon: ComponentType<{ size?: number; className?: string }>
  action: 'computer' | 'documents' | 'network' | 'recycle'
}[] = [
  { id: 'sys-computer', label: 'Computer', Icon: IconComputer, action: 'computer' },
  { id: 'sys-bin', label: 'Recycle Bin', Icon: IconRecycle, action: 'recycle' },
  { id: 'sys-net', label: 'Network', Icon: IconNetwork, action: 'network' },
  { id: 'sys-docs', label: 'Documents', Icon: IconDocuments, action: 'documents' },
]

export function GameScreen() {
  return (
    <WindowManagerProvider>
      <TimelineProvider>
        <GameScreenInner />
      </TimelineProvider>
    </WindowManagerProvider>
  )
}

function GameScreenInner() {
  const navigate = useNavigate()
  const { profile } = usePlayer()
  const { addEvidence, reset: resetEvidence, items } = useEvidence()
  const { append: appendTimeline } = useTimeline()
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
  const [showStart, setShowStart] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const [recycleHint, setRecycleHint] = useState(false)
  const openedToolsRef = useRef<Set<string>>(new Set())
  const seenEvidenceRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    resetEvidence()
    openedToolsRef.current = new Set()
    seenEvidenceRef.current = new Set()
  }, [caseDef?.caseId, resetEvidence])

  useEffect(() => {
    if (!caseDef) return
    appendTimeline({
      eventType: 'Mission',
      description: `Case loaded — ${caseDef.hostname} (${caseDef.primaryUser}). SIEM correlation active.`,
      severity: 'green',
    })
  }, [caseDef?.caseId, appendTimeline, caseDef])

  useEffect(() => {
    items.forEach((ev) => {
      if (seenEvidenceRef.current.has(ev.id)) return
      seenEvidenceRef.current.add(ev.id)
      appendTimeline({
        eventType: 'Evidence',
        description: ev.title + (ev.path ? ` — ${ev.path}` : ''),
        severity: ev.taggedIoc ? 'red' : 'yellow',
      })
    })
  }, [items, appendTimeline])

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

  useEffect(() => {
    const close = () => {
      setCtxMenu(null)
      setShowStart(false)
    }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

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

  const recordToolOpen = useCallback(
    (id: string, label: string) => {
      if (!openedToolsRef.current.has(id)) {
        openedToolsRef.current.add(id)
        appendTimeline({
          eventType: 'Tool',
          description: `Opened ${label}`,
          severity: 'green',
        })
      }
    },
    [appendTimeline],
  )

  const openTool = useCallback(
    (id: ToolId) => {
      if (!caseDef || !registry) return
      markToolsOpened()
      const tool = TOOLS.find((t) => t.id === id)
      if (tool) recordToolOpen(id, tool.label)
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
            return {
              id,
              title: 'Firewall',
              icon,
              defaultRect: { x: 140, y: 70, width: 1000, height: 620 },
              render: () => <FirewallConsole />,
            }
          case 'timeline':
            return {
              id,
              title: 'Incident Timeline',
              icon,
              defaultRect: { x: 200, y: 120, width: 420, height: 560 },
              render: () => <IncidentTimeline />,
            }
          default:
            return null
        }
      })()
      if (desc) winMgr.open(desc)
    },
    [
      caseDef,
      registry,
      createShell,
      markToolsOpened,
      setPhase,
      winMgr,
      exfilWarned,
      exfilBlocked,
      recordToolOpen,
    ],
  )

  const handleSystemShortcut = useCallback(
    (action: (typeof SYSTEM_ICONS)[number]['action']) => {
      switch (action) {
        case 'computer':
        case 'documents':
          openTool('files')
          break
        case 'network':
          openTool('net')
          break
        case 'recycle':
          setRecycleHint(true)
          window.setTimeout(() => setRecycleHint(false), 3200)
          break
        default:
          break
      }
    },
    [openTool],
  )

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

  const desktopToolLabels: Partial<Record<ToolId, string>> = {
    proc: 'Processes',
    evt: 'Event Viewer',
    net: 'Network Monitor',
    tasks: 'Tasks',
    users: 'Users',
    files: 'Explorer',
    fw: 'Firewall',
    timeline: 'Timeline',
  }

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
                <div
                  className="h-full bg-red-400 transition-all"
                  style={{ width: `${Math.round(exfilProgress * 100)}%` }}
                />
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
        <QuickLaunchRail tools={TOOLS} onOpenTool={openTool} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <section
            id="tr-desktop"
            data-desktop-root
            data-allow-context-menu
            className="relative min-h-0 flex-1 overflow-hidden tr-win10-workspace"
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setCtxMenu({ x: e.clientX, y: e.clientY })
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")`,
              }}
              aria-hidden
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex items-center justify-center overflow-hidden">
              <div
                className="select-none font-display text-[clamp(3rem,12vw,8rem)] font-bold uppercase tracking-tighter text-white/[0.045]"
                aria-hidden
              >
                {caseDef.industry.companyName}
              </div>
            </div>

            <div className="absolute left-4 top-5 z-[15] max-h-[calc(100%-16px)] overflow-y-auto overflow-x-visible pr-4">
              <div className="grid w-max max-w-[min(96vw,920px)] grid-cols-[repeat(auto-fill,96px)] gap-x-10 gap-y-10">
                {SYSTEM_ICONS.map((s) => (
                  <DesktopWorkspaceIcon
                    key={s.id}
                    label={s.label}
                    Icon={s.Icon}
                    onOpen={() => handleSystemShortcut(s.action)}
                  />
                ))}
                {TOOLS.map((t) => (
                  <DesktopWorkspaceIcon
                    key={t.id}
                    label={desktopToolLabels[t.id] ?? t.label}
                    Icon={t.Icon}
                    onOpen={() => openTool(t.id)}
                  />
                ))}
              </div>
            </div>

            <WindowSurface />

            <SiemToastHost enabled={!showAlert} />

            {ctxMenu ? (
              <div
                className="fixed z-[1200] min-w-[200px] rounded border border-white/15 bg-[#2d2d2d] py-1 font-mono text-[11px] text-[#e8edf5] shadow-xl"
                style={{ left: ctxMenu.x, top: ctxMenu.y }}
                onClick={(e) => e.stopPropagation()}
                role="menu"
              >
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left hover:bg-[#5e9bff]/25"
                  onClick={() => {
                    openTool('terminal')
                    setCtxMenu(null)
                  }}
                >
                  Open Terminal here
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left hover:bg-[#5e9bff]/25"
                  onClick={() => {
                    openTool('files')
                    setCtxMenu(null)
                  }}
                >
                  Open Explorer
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left hover:bg-[#5e9bff]/25"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('tr-focus-notes'))
                    setCtxMenu(null)
                  }}
                >
                  Investigation notes…
                </button>
                <div className="my-1 h-px bg-white/10" />
                <button type="button" className="block w-full px-4 py-2 text-left text-[#8a9ab5]" disabled>
                  Paste (N/A)
                </button>
              </div>
            ) : null}

            {recycleHint ? (
              <div className="pointer-events-none absolute bottom-[56px] left-1/2 z-[950] -translate-x-1/2 rounded border border-white/10 bg-black/80 px-4 py-2 font-mono text-[11px] text-[#e8edf5] shadow-lg">
                Recycle Bin is empty.
              </div>
            ) : null}

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

          <WindowsTaskbar allTools={TOOLS} onOpenTool={openTool} showStart={showStart} setShowStart={setShowStart} />
        </div>

        <EvidenceLocker />
      </div>

      {showReport ? (
        <ReportEditor hardeningPct={hardeningPct} onClose={() => setShowReport(false)} forceSubmit={timeUp} />
      ) : null}
    </div>
  )
}

function QuickLaunchRail({
  tools,
  onOpenTool,
}: {
  tools: ToolDef[]
  onOpenTool: (id: ToolId) => void
}) {
  return (
    <aside
      className="flex w-[52px] shrink-0 flex-col items-center gap-1 border-r border-black bg-[#1a1a1a] py-2"
      aria-label="Quick launch"
    >
      {tools.map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.label}
          className="flex h-10 w-10 items-center justify-center rounded-md text-[#dce9ff] hover:bg-white/10"
          onClick={() => onOpenTool(t.id)}
        >
          <t.Icon size={20} />
        </button>
      ))}
    </aside>
  )
}

function DesktopWorkspaceIcon({
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
      title={`Double-click: ${label}`}
      className="group flex flex-col items-center gap-1 rounded-md border border-transparent bg-transparent p-0 outline-none hover:border-white/10 hover:bg-black/35 focus-visible:border-[#5e9bff]/50 focus-visible:bg-black/40"
    >
      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/25 shadow-inner shadow-black/40 transition-colors group-hover:border-white/15 group-hover:bg-black/40">
        <Icon size={38} className="text-[#b8d9ff]" />
      </div>
      <span className="max-w-[92px] text-center font-mono text-[11px] leading-snug text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
        {label}
      </span>
    </button>
  )
}

function WindowsTaskbar({
  allTools,
  onOpenTool,
  showStart,
  setShowStart,
}: {
  allTools: ToolDef[]
  onOpenTool: (id: ToolId) => void
  showStart: boolean
  setShowStart: (v: boolean | ((b: boolean) => boolean)) => void
}) {
  const { windows, toggleMinimize, bringToFront } = useWindows()
  const [clockStr, setClockStr] = useState(() => formatTrayClock())

  useEffect(() => {
    const tick = () => setClockStr(formatTrayClock())
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="relative z-[920] shrink-0 border-t border-black bg-[#1a1a1a]">
      <div className="flex h-12 w-full items-center gap-2 px-2">
        <button
          type="button"
          title="Start"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation()
            setShowStart((s) => !s)
          }}
        >
          <IconWindowsLogo size={22} className="text-[#00a2ed]" />
        </button>

        <div className="flex max-w-[min(520px,40vw)] flex-1 items-center gap-2 rounded-sm border border-[#3c3c3c] bg-[#3c3c3c] px-3 py-1.5 shadow-inner">
          <IconSearch size={16} className="shrink-0 text-[#a8a8a8]" aria-hidden />
          <span className="truncate font-mono text-[12px] text-[#b4b4b4]">Search tools and evidence…</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-1">
          {windows.map((w) => {
            const tool = allTools.find((t) => t.id === w.id)
            return (
              <button
                key={w.id}
                type="button"
                className={`flex max-w-[160px] shrink-0 items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[11px] ${
                  w.minimized
                    ? 'border-transparent bg-transparent text-[#9ca3af] hover:bg-white/10'
                    : 'border-[#4a4a4a] bg-[#2d2d2d] text-[#f3f4f6]'
                }`}
                onClick={() => {
                  if (w.minimized) bringToFront(w.id)
                  else toggleMinimize(w.id)
                }}
                title={w.title}
              >
                {tool ? <tool.Icon size={14} /> : null}
                <span className="truncate">{w.title}</span>
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-4 border-l border-white/10 pl-4 pr-1">
          <IconWifi size={17} className="text-[#d1d5db]" aria-hidden />
          <IconVolume size={17} className="text-[#d1d5db]" aria-hidden />
          <time
            className="min-w-[44px] text-center font-mono text-[12px] tabular-nums text-[#f3f4f6]"
            dateTime={clockStr}
          >
            {clockStr}
          </time>
        </div>
      </div>

      {showStart ? (
        <div
          className="pointer-events-auto absolute bottom-full left-0 z-[950] mb-1 ml-1 w-56 rounded border border-white/10 bg-[#1e1e1e] py-2 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-white/10 px-3 py-2 font-display text-[11px] uppercase tracking-wide text-[#8a9ab5]">
            ThreatRecon
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {allTools.map((t) => (
              <button
                key={t.id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-[11px] hover:bg-[#5e9bff]/20"
                onClick={() => {
                  onOpenTool(t.id)
                  setShowStart(false)
                }}
              >
                <t.Icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-1 w-full border-t border-white/10 px-3 py-2 text-left font-mono text-[11px] text-[#8a9ab5] hover:bg-white/5"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('tr-focus-notes'))
              setShowStart(false)
            }}
          >
            Investigation notes
          </button>
        </div>
      ) : null}
    </div>
  )
}

function formatTrayClock(): string {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

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
