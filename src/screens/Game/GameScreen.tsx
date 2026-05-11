import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../../contexts/GameContext'
import { useEvidence } from '../../contexts/EvidenceContext'
import { usePlayer } from '../../contexts/PlayerContext'
import { ClipboardHistoryProvider, useClipboardHistory } from '../../contexts/ClipboardHistoryContext'
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
} from '../../components/shared/Icons'
import { IconEdgeLogo, Win11WatermarkLogo } from '../../components/Win11/Win11Icons'
import { Win11LockScreen, Win11LoginScreen } from '../../components/Win11/Win11LockLogin'
import { Win11Taskbar } from '../../components/Win11/Win11Taskbar'
import { Win11StartMenu, type StartMenuTool } from '../../components/Win11/Win11StartMenu'
import {
  Win11RunDialog,
  Win11SearchOverlay,
  Win11TaskViewOverlay,
  Win11QuickSettings,
  Win11ActionCenter,
  Win11WidgetsPanel,
  Win11ClipboardPanel,
  Win11AltTabSwitcher,
  Win11CalendarFlyout,
  Win11ScreenshotToast,
} from '../../components/Win11/Win11Overlays'
import { Notepad } from '../../components/Notepad/Notepad'
import { TaskManager } from '../../components/TaskManager/TaskManager'
import { SettingsApp } from '../../components/SettingsApp/SettingsApp'
import { PhaseTracker } from './PhaseTracker'
import { Timer } from './Timer'
import type { GamePhase } from '../../contexts/GameContext'
import { ReportEditor } from '../../components/ReportEditor/ReportEditor'
import { generateBaselineEvents } from '../../data/baselineSystem'

function IconSettingsGear({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="text-[#c8e8ff]">
      <path
        fill="currentColor"
        d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      />
    </svg>
  )
}

function IconNotepadDoc({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="text-[#c8e8ff]">
      <path fill="currentColor" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
    </svg>
  )
}

interface ToolDef {
  id: string
  label: string
  Icon: ComponentType<{ size?: number; className?: string }>
}

const TOOLS: ToolDef[] = [
  { id: 'terminal', label: 'Terminal', Icon: IconTerminal },
  { id: 'proc', label: 'Processes', Icon: IconCpu },
  { id: 'evt', label: 'Event Viewer', Icon: IconList },
  { id: 'reg', label: 'Registry Editor', Icon: IconDatabase },
  { id: 'net', label: 'Network Monitor', Icon: IconNetwork },
  { id: 'tasks', label: 'Task Scheduler', Icon: IconClock },
  { id: 'users', label: 'Local Users', Icon: IconUsers },
  { id: 'files', label: 'File Explorer', Icon: IconFolder },
  { id: 'fw', label: 'Firewall Manager', Icon: IconShield },
  { id: 'timeline', label: 'Incident Timeline', Icon: IconTimeline },
]

type CoreToolId = (typeof TOOLS)[number]['id']

type OpenToolId =
  | CoreToolId
  | 'settings-app'
  | 'notepad'
  | 'taskmgr'
  | 'edge-shell'
  | 'documents'

export function GameScreen() {
  return (
    <TimelineProvider>
      <ClipboardHistoryProvider>
        <GameScreenInner />
      </ClipboardHistoryProvider>
    </TimelineProvider>
  )
}

function GameScreenInner() {
  const navigate = useNavigate()
  const { profile } = usePlayer()
  const { reset: resetEvidence } = useEvidence()
  const game = useGame()
  const { caseDef, difficulty } = game

  const [authPhase, setAuthPhase] = useState<'lock' | 'login' | 'session'>('lock')

  useEffect(() => {
    resetEvidence()
  }, [caseDef?.caseId, resetEvidence])

  useEffect(() => {
    if (authPhase !== 'lock') return
    const wake = () => setAuthPhase('login')
    window.addEventListener('keydown', wake)
    return () => window.removeEventListener('keydown', wake)
  }, [authPhase])

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

  const displayName = profile.name?.trim() || 'Andre Boone'

  if (authPhase === 'lock') {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <Win11LockScreen displayName={displayName} onWake={() => setAuthPhase('login')} />
      </div>
    )
  }

  if (authPhase === 'login') {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <Win11LoginScreen displayName={displayName} onSignedIn={() => setAuthPhase('session')} />
      </div>
    )
  }

  return (
    <WindowManagerProvider key={caseDef.caseId} geometryStorageKey={caseDef.caseId}>
      <GameDesk displayName={displayName} />
    </WindowManagerProvider>
  )
}

function GameDesk({ displayName }: { displayName: string }) {
  const { profile } = usePlayer()
  const { addEvidence, items } = useEvidence()
  const clip = useClipboardHistory()
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
  const [lockedOverlay, setLockedOverlay] = useState(false)
  const [showAlert, setShowAlert] = useState(true)
  const [showReport, setShowReport] = useState(false)
  const [showStart, setShowStart] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; desktop?: boolean } | null>(null)
  const [iconCtx, setIconCtx] = useState<{ x: number; y: number; label: string; toolId?: OpenToolId } | null>(null)
  const [recycleHint, setRecycleHint] = useState(false)
  const [selectedDesktop, setSelectedDesktop] = useState<string | null>(null)
  const openedToolsRef = useRef<Set<string>>(new Set())
  const seenEvidenceRef = useRef<Set<string>>(new Set())
  const [recentList, setRecentList] = useState<{ id: string; label: string; at: number }[]>([])

  const [showRun, setShowRun] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTaskView, setShowTaskView] = useState(false)
  const [showQuick, setShowQuick] = useState(false)
  const [showActionCenter, setShowActionCenter] = useState(false)
  const [showWidgets, setShowWidgets] = useState(false)
  const [showClipboardPanel, setShowClipboardPanel] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [shotToast, setShotToast] = useState(false)

  const [altTabOpen, setAltTabOpen] = useState(false)
  const [altTabIdx, setAltTabIdx] = useState(0)
  const altTabIdxRef = useRef(0)

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
      if (ev.path && ev.taggedIoc) clip.push(ev.path)
      if (ev.title) clip.push(`Evidence: ${ev.title}`)
    })
  }, [items, appendTimeline, clip])

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

  /** Dismiss shell popovers on outside click — MUST skip taskbar + overlay roots or Start/Search never stay open. */
  useEffect(() => {
    const targetIsChrome = (el: HTMLElement | null) =>
      !!(el?.closest('#tr-taskbar') || el?.closest('[data-win11-overlay-root]'))

    const onMouseDown = (e: WindowEventMap['mousedown']) => {
      const el = e.target as HTMLElement | null
      if (targetIsChrome(el)) return
      setCtxMenu(null)
      setIconCtx(null)
      setShowCalendar(false)
      setShowStart(false)
      setShowSearch(false)
      setShowTaskView(false)
      setShowQuick(false)
      setShowActionCenter(false)
      setShowWidgets(false)
      setShowClipboardPanel(false)
      setShowRun(false)
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [])

  useEffect(() => {
    const onSnapSecond = () => {
      appendTimeline({
        eventType: 'Tool',
        description: 'Snap layout applied — pick a second window to fill remaining space.',
        severity: 'yellow',
      })
    }
    window.addEventListener('tr-snap-second-window', onSnapSecond)
    return () => window.removeEventListener('tr-snap-second-window', onSnapSecond)
  }, [appendTimeline])

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
      setRecentList((prev) => [{ id, label, at: Date.now() }, ...prev.filter((r) => r.id !== id)].slice(0, 6))
    },
    [appendTimeline],
  )

  const toolsById = useMemo(() => {
    const m = new Map<string, StartMenuTool>()
    for (const t of TOOLS) m.set(t.id, { id: t.id, label: t.label, Icon: t.Icon })
    m.set('settings-app', { id: 'settings-app', label: 'Settings', Icon: IconSettingsGear })
    m.set('notepad', { id: 'notepad', label: 'Notepad', Icon: IconNotepadDoc })
    m.set('taskmgr', { id: 'taskmgr', label: 'Task Manager', Icon: IconCpu })
    m.set('edge-shell', { id: 'edge-shell', label: 'Microsoft Edge', Icon: IconEdgeLogo })
    m.set('documents', { id: 'documents', label: 'Documents', Icon: IconDocuments })
    return m
  }, [])

  const allToolsById = useMemo(() => {
    const m = new Map<string, ToolDef>()
    TOOLS.forEach((t) => m.set(t.id, t))
    m.set('settings-app', { id: 'settings-app', label: 'Settings', Icon: IconSettingsGear })
    m.set('notepad', { id: 'notepad', label: 'Notepad', Icon: IconNotepadDoc })
    m.set('taskmgr', { id: 'taskmgr', label: 'Task Manager', Icon: IconCpu })
    m.set('edge-shell', { id: 'edge-shell', label: 'Edge', Icon: IconEdgeLogo })
    return m
  }, [])

  const pinnedTaskbar: ToolDef[] = useMemo(
    () => [
      { id: 'files', label: 'File Explorer', Icon: IconFolder },
      { id: 'terminal', label: 'Terminal', Icon: IconTerminal },
      { id: 'settings-app', label: 'Settings', Icon: IconSettingsGear },
    ],
    [],
  )

  const recommended = useMemo(() => {
    const now = Date.now()
    return recentList.slice(0, 4).map((r) => {
      const mins = Math.max(1, Math.round((now - r.at) / 60000))
      return { id: r.id, label: r.label, ago: `Opened ${mins} min${mins === 1 ? '' : 's'} ago` }
    })
  }, [recentList])

  const eventSnippets = useMemo(() => {
    if (!caseDef) return []
    return generateBaselineEvents(caseDef.hostname, caseDef.primaryUser).slice(0, 24).map((e) => ({
      eventId: e.eventId,
      title: (e.summary ?? '').slice(0, 96),
    }))
  }, [caseDef])

  const topSearchApps = useMemo(() => {
    const xs = [...TOOLS.map((t) => ({ id: t.id, label: t.label, Icon: t.Icon }))]
    xs.push({ id: 'settings-app', label: 'Settings', Icon: IconSettingsGear })
    xs.push({ id: 'notepad', label: 'Notepad', Icon: IconNotepadDoc })
    xs.push({ id: 'taskmgr', label: 'Task Manager', Icon: IconCpu })
    return xs
  }, [])

  const openTool = useCallback(
    (id: OpenToolId) => {
      if (!caseDef || !registry) return
      markToolsOpened()

      const record = (tid: string, lab: string) => recordToolOpen(tid, lab)

      const coreIcon = (tid: string) => {
        const t = TOOLS.find((x) => x.id === tid)
        return t ? <t.Icon size={14} className="text-[#5e9bff]" /> : null
      }

      switch (id) {
        case 'documents':
          record('files', 'File Explorer')
          winMgr.open({
            id: 'files',
            title: 'File Explorer',
            icon: coreIcon('files'),
            render: () => <FileExplorer />,
            defaultRect: { x: 100, y: 70, width: 960, height: 580 },
          })
          return
        case 'settings-app':
          record('settings-app', 'Settings')
          winMgr.open({
            id: 'settings-app',
            title: 'Settings',
            icon: <IconSettingsGear size={14} />,
            defaultRect: { x: 140, y: 60, width: 920, height: 560 },
            render: () => <SettingsApp caseDef={caseDef} />,
          })
          return
        case 'notepad':
          record('notepad', 'Notepad')
          winMgr.open({
            id: 'notepad',
            title: 'Notepad',
            icon: <IconNotepadDoc size={14} />,
            defaultRect: { x: 180, y: 100, width: 720, height: 520 },
            render: () => <Notepad caseId={caseDef.caseId} onAppendClipboard={(s) => clip.push(s)} />,
          })
          return
        case 'taskmgr':
          record('taskmgr', 'Task Manager')
          winMgr.open({
            id: 'taskmgr',
            title: 'Task Manager',
            icon: <IconCpu size={14} className="text-[#5e9bff]" />,
            defaultRect: { x: 120, y: 80, width: 980, height: 600 },
            render: () => <TaskManager caseDef={caseDef} />,
          })
          return
        case 'edge-shell':
          record('edge-shell', 'Microsoft Edge')
          winMgr.open({
            id: 'edge-shell',
            title: 'Microsoft Edge',
            icon: <IconEdgeLogo size={14} />,
            defaultRect: { x: 90, y: 50, width: 960, height: 580 },
            render: () => (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#f6f6f6] p-8 text-center text-[#222]">
                <div className="text-[18px] font-semibold">Microsoft Edge (simulated)</div>
                <p className="max-w-md text-[13px] leading-relaxed text-[#555]">
                  External browsing is disabled in ThreatRecon training shells. Use File Explorer, Terminal, and SOC tools to continue the investigation.
                </p>
              </div>
            ),
          })
          return
        default:
          break
      }

      const tool = TOOLS.find((t) => t.id === id)
      if (tool) record(id, tool.label)
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
            return {
              id,
              title: 'File Explorer',
              icon,
              defaultRect: { x: 100, y: 70, width: 960, height: 580 },
              render: () => <FileExplorer />,
            }
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
      clip,
    ],
  )

  const handleRunCommand = useCallback(
    (cmd: string) => {
      const c = cmd.toLowerCase().replace(/\.exe$/, '')
      const map: Record<string, OpenToolId> = {
        cmd: 'terminal',
        regedit: 'reg',
        eventvwr: 'evt',
        taskmgr: 'taskmgr',
        mmc: 'settings-app',
        notepad: 'notepad',
      }
      const tid = map[c]
      if (tid) openTool(tid)
    },
    [openTool],
  )

  const handleDesktopShortcut = useCallback(
    (kind: string) => {
      switch (kind) {
        case 'thispc':
        case 'controlpanel':
          openTool('settings-app')
          return
        case 'recycle':
          setRecycleHint(true)
          window.setTimeout(() => setRecycleHint(false), 3200)
          return
        case 'network':
          openTool('net')
          return
        case 'documents':
        case 'downloads':
          openTool('files')
          return
        default:
          return
      }
    },
    [openTool],
  )

  useEffect(() => {
    if (!caseDef) return
    if (!showAlert) openTool('terminal')
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [caseDef?.caseId, showAlert])

  useEffect(() => {
    const desk = document.getElementById('tr-desktop')
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable=true]')) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') return
        if (e.altKey && e.key === 'Tab') return
      }

      const meta = e.metaKey

      if ((meta || e.key === 'Meta') && !e.ctrlKey && !e.altKey && e.code === 'KeyL') {
        e.preventDefault()
        appendTimeline({ eventType: 'Mission', description: 'Workstation locked (simulated Win+L)', severity: 'yellow' })
        setLockedOverlay(true)
        return
      }

      if ((meta || e.ctrlKey) && e.code === 'KeyD') {
        e.preventDefault()
        winMgr.toggleDesktop()
        return
      }
      if ((meta || e.ctrlKey) && e.code === 'KeyE') {
        e.preventDefault()
        openTool('files')
        return
      }
      if ((meta || e.ctrlKey) && e.code === 'KeyR') {
        e.preventDefault()
        setShowRun(true)
        return
      }
      if (meta && e.code === 'Tab') {
        e.preventDefault()
        setShowTaskView((v) => !v)
        return
      }
      if ((meta || e.ctrlKey) && e.code === 'KeyW') {
        e.preventDefault()
        setShowWidgets((w) => !w)
        setShowQuick(false)
        return
      }
      if ((meta || e.ctrlKey) && e.code === 'KeyV') {
        e.preventDefault()
        setShowClipboardPanel(true)
        return
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
        e.preventDefault()
        openTool('taskmgr')
        return
      }

      if (e.altKey && e.key === 'Tab') {
        e.preventDefault()
        const vis = winMgr.windows.filter((w) => !w.minimized)
        if (vis.length === 0) return
        setAltTabOpen(true)
        if (!e.repeat) {
          const next = (altTabIdxRef.current + 1) % vis.length
          altTabIdxRef.current = next
          setAltTabIdx(next)
        }
        return
      }

      if ((meta || e.ctrlKey) && !e.shiftKey && !e.altKey && e.code === 'KeyS') {
        e.preventDefault()
        setShowStart((s) => !s)
        setShowSearch(false)
        return
      }

      if (e.key === 'F5' && desk?.contains(t)) {
        e.preventDefault()
        appendTimeline({ eventType: 'Mission', description: 'Desktop refreshed (F5)', severity: 'green' })
        return
      }

      if (e.key === 'PrintScreen') {
        e.preventDefault()
        setShotToast(true)
        window.setTimeout(() => setShotToast(false), 2200)
        clip.push('Screenshot PNG (simulated)')
      }

      if (e.altKey && e.code === 'F4') {
        e.preventDefault()
        const top = [...winMgr.windows].sort((a, b) => b.zIndex - a.zIndex)[0]
        if (top) winMgr.close(top.id)
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey && altTabOpen) {
        const vis = winMgr.windows.filter((w) => !w.minimized)
        const pick = vis[altTabIdxRef.current]
        if (pick) winMgr.bringToFront(pick.id)
        setAltTabOpen(false)
      }
    }

    window.addEventListener('keydown', onKey, true)
    window.addEventListener('keyup', onKeyUp, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
  }, [
    appendTimeline,
    openTool,
    winMgr,
    showAlert,
    caseDef,
    clip,
    altTabOpen,
  ])

  if (!caseDef || !difficulty) return null

  const hardeningPct =
    (Object.keys(hardeningDone).filter((k) => hardeningDone[k]).length /
      Math.max(1, caseDef.correctHardeningSteps.length)) *
    100

  const desktopLabels: Record<string, string> = {
    thispc: 'This PC',
    recycle: 'Recycle Bin',
    network: 'Network',
    controlpanel: 'Control Panel',
    documents: 'Documents',
    downloads: 'Downloads',
    terminal: 'Terminal',
    evt: 'Event Viewer',
    reg: 'Registry Editor',
    net: 'Network Monitor',
    proc: 'Process Monitor',
    tasks: 'Task Scheduler',
    fw: 'Firewall Manager',
    files: 'File Explorer',
    users: 'Local Users',
    timeline: 'Incident Timeline',
    settings: 'Settings',
    notepad: 'Notepad',
  }

  const desktopRows: { key: string; Icon: ComponentType<{ size?: number; className?: string }>; tool?: OpenToolId; sys?: string }[][] = [
    [
      { key: 'thispc', Icon: IconComputer, sys: 'thispc' },
      { key: 'recycle', Icon: IconRecycle, sys: 'recycle' },
      { key: 'network', Icon: IconNetwork, sys: 'network' },
      { key: 'controlpanel', Icon: IconSettingsGear, sys: 'controlpanel' },
      { key: 'documents', Icon: IconDocuments, sys: 'documents' },
      { key: 'downloads', Icon: IconFolder, sys: 'downloads' },
    ],
    [
      { key: 'terminal', Icon: IconTerminal, tool: 'terminal' },
      { key: 'evt', Icon: IconList, tool: 'evt' },
      { key: 'reg', Icon: IconDatabase, tool: 'reg' },
      { key: 'net', Icon: IconNetwork, tool: 'net' },
      { key: 'proc', Icon: IconCpu, tool: 'proc' },
      { key: 'tasks', Icon: IconClock, tool: 'tasks' },
    ],
    [
      { key: 'fw', Icon: IconShield, tool: 'fw' },
      { key: 'files', Icon: IconFolder, tool: 'files' },
      { key: 'users', Icon: IconUsers, tool: 'users' },
      { key: 'timeline', Icon: IconTimeline, tool: 'timeline' },
      { key: 'settings', Icon: IconSettingsGear, tool: 'settings-app' },
      { key: 'notepad', Icon: IconNotepadDoc, tool: 'notepad' },
    ],
  ]

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => s[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'OP'

  const avatarInitials = `${initials}`

  return (
    <div className="tr-win11-font flex h-screen max-h-screen flex-col bg-[#060a12] text-[#e8edf5]">
      <PhaseTracker phase={phase} completed={completed} onPhaseSelect={setPhase} />
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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <section
            id="tr-desktop"
            data-desktop-root
            data-allow-context-menu
            className="relative min-h-0 flex-1 overflow-hidden tr-win11-bloom"
            onMouseDown={() => setSelectedDesktop(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setCtxMenu({ x: e.clientX, y: e.clientY, desktop: true })
            }}
          >
            <div className="absolute bottom-3 right-3 z-[12]" aria-hidden>
              <Win11WatermarkLogo />
            </div>

            {lockedOverlay ? (
              <div className="absolute inset-0 z-[5000]">
                <Win11LockScreen displayName={displayName} onWake={() => setLockedOverlay(false)} />
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex items-center justify-center overflow-hidden">
              <div
                className="select-none font-display text-[clamp(3rem,12vw,8rem)] font-bold uppercase tracking-tighter text-white/[0.035]"
                aria-hidden
              >
                {caseDef.industry.companyName}
              </div>
            </div>

            <div className="absolute left-5 top-5 z-[15] flex flex-col gap-2">
              {desktopRows.map((row, ri) => (
                <div key={ri} className="flex flex-row gap-2">
                  {row.map((cell) => (
                    <DesktopIconWin11
                      key={cell.key}
                      label={desktopLabels[cell.key] ?? cell.key}
                      Icon={cell.Icon}
                      selected={selectedDesktop === cell.key}
                      onSelect={() => setSelectedDesktop(cell.key)}
                      onOpen={() => {
                        if (cell.tool) openTool(cell.tool)
                        else if (cell.sys) handleDesktopShortcut(cell.sys)
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIconCtx({
                          x: e.clientX,
                          y: e.clientY,
                          label: desktopLabels[cell.key] ?? cell.key,
                          toolId: cell.tool,
                        })
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>

            <WindowSurface />

            <Win11RunDialog open={showRun} onClose={() => setShowRun(false)} onSubmitCommand={handleRunCommand} />
            <Win11SearchOverlay
              open={showSearch}
              onClose={() => setShowSearch(false)}
              query={searchQuery}
              setQuery={setSearchQuery}
              topApps={topSearchApps}
              onPickTool={(id) => openTool(id as OpenToolId)}
              eventSnippets={eventSnippets}
            />
            <Win11TaskViewOverlay open={showTaskView} onClose={() => setShowTaskView(false)} />
            <Win11QuickSettings open={showQuick} onClose={() => setShowQuick(false)} anchorRight />
            <Win11ActionCenter open={showActionCenter} onClose={() => setShowActionCenter(false)} caseTitle={caseDef.threatActor.displayName} />
            <Win11WidgetsPanel open={showWidgets} onClose={() => setShowWidgets(false)} threatActor={caseDef.threatActor.displayName} />
            <Win11ClipboardPanel open={showClipboardPanel} onClose={() => setShowClipboardPanel(false)} />
            <Win11CalendarFlyout open={showCalendar} onClose={() => setShowCalendar(false)} />
            <Win11ScreenshotToast visible={shotToast} />

            <Win11AltTabSwitcher
              open={altTabOpen}
              index={altTabIdx}
              windows={winMgr.windows.filter((w) => !w.minimized).map((w) => ({ id: w.id, title: w.title }))}
              onSelect={(wid) => {
                winMgr.bringToFront(wid)
                setAltTabOpen(false)
              }}
            />

            <Win11StartMenu
              open={showStart}
              onClose={() => setShowStart(false)}
              toolsById={toolsById}
              recommended={recommended}
              displayName={displayName}
              avatarInitials={avatarInitials}
              onOpenTool={(tid) => openTool(tid as OpenToolId)}
              onOpenDocuments={() => openTool('documents')}
              onPowerSleep={() =>
                appendTimeline({
                  eventType: 'Mission',
                  description: 'Sleep requested from Start — simulation only.',
                  severity: 'green',
                })
              }
            />

            <SiemToastHost enabled={!showAlert} />

            {ctxMenu ? (
              <DesktopContextMenuWin11
                position={{ x: ctxMenu.x, y: ctxMenu.y }}
                onDismiss={() => setCtxMenu(null)}
                onTerminal={() => {
                  openTool('terminal')
                  setCtxMenu(null)
                }}
                onNotes={() => {
                  window.dispatchEvent(new CustomEvent('tr-focus-notes'))
                  setCtxMenu(null)
                }}
                onPersonalize={() => setCtxMenu(null)}
              />
            ) : null}

            {iconCtx ? (
              <IconContextMenu
                position={{ x: iconCtx.x, y: iconCtx.y }}
                label={iconCtx.label}
                onOpen={() => {
                  if (iconCtx.toolId) openTool(iconCtx.toolId)
                  setIconCtx(null)
                }}
                onDismiss={() => setIconCtx(null)}
              />
            ) : null}

            {recycleHint ? (
              <div className="pointer-events-none absolute bottom-[56px] left-1/2 z-[950] -translate-x-1/2 rounded border border-white/10 bg-black/80 px-4 py-2 text-[11px] text-[#e8edf5] shadow-lg">
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

          <Win11Taskbar
            pinnedTools={pinnedTaskbar}
            onOpenTool={(id) => openTool(id as OpenToolId)}
            allToolsById={allToolsById}
            showStart={showStart}
            setShowStart={(v) => {
              setShowStart(typeof v === 'function' ? v(showStart) : v)
              setShowQuick(false)
              setShowWidgets(false)
            }}
            openEdgeShell={() => openTool('edge-shell')}
            openSearchOverlay={showSearch}
            setSearchOverlay={(v) => {
              setShowSearch(v)
              setShowStart(false)
            }}
            openTaskView={showTaskView}
            setTaskView={(v) => setShowTaskView(v)}
            openQuickSettings={showQuick}
            setQuickSettings={(v) => {
              setShowQuick(v)
              setShowWidgets(false)
            }}
            openActionCenter={showActionCenter}
            setActionCenter={(v) => setShowActionCenter(v)}
            openWidgets={showWidgets}
            setWidgets={(v) => {
              setShowWidgets(v)
              setShowQuick(false)
            }}
            onOpenSettingsApp={() => openTool('settings-app')}
            onClockClick={() => {
              setShowCalendar((c) => !c)
              setShowActionCenter(false)
            }}
            onShowDesktop={() => winMgr.toggleDesktop()}
          />
        </div>

        <EvidenceLocker />
      </div>

      {showReport ? (
        <ReportEditor hardeningPct={hardeningPct} onClose={() => setShowReport(false)} forceSubmit={timeUp} />
      ) : null}
    </div>
  )
}

function DesktopIconWin11({
  label,
  Icon,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
}: {
  label: string
  Icon: ComponentType<{ size?: number; className?: string }>
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  onContextMenu: (e: ReactMouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onSelect}
      onDoubleClick={onOpen}
      onContextMenu={onContextMenu}
      className={`group flex w-[80px] flex-col items-center gap-0.5 rounded border bg-transparent p-1 outline-none transition-shadow duration-200 ease-out hover:shadow-[0_0_12px_rgba(255,255,255,0.18)] ${
        selected ? 'border-[#0078d4]/80 bg-[#0078d4]/20' : 'border-transparent'
      }`}
      style={{ gap: '4px' }}
    >
      <div className="flex h-[52px] w-[52px] items-center justify-center">
        <Icon size={44} className="text-[#dce9ff] drop-shadow-md" />
      </div>
      <span
        className="max-w-[80px] text-center text-[13px] leading-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.92)]"
        style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif" }}
      >
        {label}
      </span>
    </button>
  )
}

function IconContextMenu({
  position,
  label,
  onOpen,
  onDismiss,
}: {
  position: { x: number; y: number }
  label: string
  onOpen: () => void
  onDismiss: () => void
}) {
  return (
    <div
      role="menu"
      className="fixed z-[1250] min-w-[200px] rounded-xl border border-white/12 bg-[#2d2d2d]/98 py-1 text-[12px] text-[#f3f3f3] shadow-2xl backdrop-blur-lg"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" className="block w-full px-4 py-2 text-left hover:bg-white/10" onClick={onOpen}>
        Open
      </button>
      <button type="button" className="block w-full px-4 py-2 text-left text-[#888]" disabled>
        Pin to taskbar (simulated)
      </button>
      <button type="button" className="block w-full px-4 py-2 text-left text-[#888]" disabled>
        Pin to Start (simulated)
      </button>
      <button type="button" className="block w-full px-4 py-2 text-left hover:bg-white/10" onClick={onDismiss}>
        Properties — {label}
      </button>
      <button type="button" className="block w-full px-4 py-2 text-left text-[#888]" disabled>
        Delete shortcut (simulated)
      </button>
    </div>
  )
}

function DesktopContextMenuWin11({
  position,
  onDismiss,
  onTerminal,
  onNotes,
  onPersonalize,
}: {
  position: { x: number; y: number }
  onDismiss: () => void
  onTerminal: () => void
  onNotes: () => void
  onPersonalize: () => void
}) {
  const tipBtn = 'rounded p-1.5 hover:bg-white/15'
  return (
    <div
      role="menu"
      className="fixed z-[1200] w-[240px] rounded-xl border border-white/12 bg-[#2d2d2d]/98 py-2 text-[12px] text-[#f3f3f3] shadow-2xl backdrop-blur-lg"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-around border-b border-white/10 px-2 pb-2">
        <button type="button" title="Cut" className={tipBtn}>
          ✂
        </button>
        <button type="button" title="Copy" className={tipBtn}>
          📋
        </button>
        <button type="button" title="Paste" className={tipBtn}>
          📄
        </button>
        <button type="button" title="Rename" className={tipBtn}>
          ✎
        </button>
        <button type="button" title="Share" className={tipBtn}>
          🔗
        </button>
        <button type="button" title="Delete" className={tipBtn}>
          🗑
        </button>
      </div>
      <button type="button" className="flex w-full items-center justify-between px-4 py-2 hover:bg-white/10">
        View <span className="text-[#888]">›</span>
      </button>
      <button type="button" className="flex w-full items-center justify-between px-4 py-2 hover:bg-white/10">
        Sort by <span className="text-[#888]">›</span>
      </button>
      <button type="button" className="block w-full px-4 py-2 text-left hover:bg-white/10">
        Show more options (legacy)
      </button>
      <div className="my-1 h-px bg-white/10" />
      <button type="button" className="block w-full px-4 py-2 text-left hover:bg-white/10" onClick={onTerminal}>
        Open Terminal
      </button>
      <button type="button" className="block w-full px-4 py-2 text-left hover:bg-white/10" onClick={onNotes}>
        Open Investigation Notes
      </button>
      <button type="button" className="block w-full px-4 py-2 text-left hover:bg-white/10" onClick={onPersonalize}>
        Personalize
      </button>
      <button type="button" className="mt-1 block w-full px-4 py-2 text-left text-[11px] text-[#888]" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  )
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
