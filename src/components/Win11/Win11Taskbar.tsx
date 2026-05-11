import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { useWindows } from '../WindowManager/WindowManager'
import {
  IconWin11Start,
  IconEdgeLogo,
  IconTaskView,
  IconBattery,
  IconBell,
  IconWifiBars,
  IconSpeaker,
  IconWidgets,
} from './Win11Icons'

type ToolId = string

interface ToolDef {
  id: ToolId
  label: string
  Icon: ComponentType<{ size?: number; className?: string }>
}

export function Win11Taskbar({
  pinnedTools,
  onOpenTool,
  allToolsById,
  showStart: _showStart,
  setShowStart,
  openEdgeShell,
  openSearchOverlay: _openSearchOverlay,
  setSearchOverlay,
  openTaskView,
  setTaskView,
  openQuickSettings,
  setQuickSettings,
  openActionCenter,
  setActionCenter,
  openWidgets,
  setWidgets,
  onOpenSettingsApp,
  onClockClick,
  onShowDesktop,
}: {
  pinnedTools: ToolDef[]
  onOpenTool: (id: ToolId) => void
  allToolsById: Map<string, ToolDef>
  showStart: boolean
  setShowStart: (v: boolean | ((b: boolean) => boolean)) => void
  openEdgeShell: () => void
  openSearchOverlay: boolean
  setSearchOverlay: (v: boolean) => void
  openTaskView: boolean
  setTaskView: (v: boolean) => void
  openQuickSettings: boolean
  setQuickSettings: (v: boolean) => void
  openActionCenter: boolean
  setActionCenter: (v: boolean) => void
  openWidgets: boolean
  setWidgets: (v: boolean) => void
  onOpenSettingsApp: () => void
  onClockClick: () => void
  onShowDesktop: () => void
}) {
  const { windows, toggleMinimize, bringToFront, desktopClearActive } = useWindows()
  const [nowLine1, setNowLine1] = useState('')
  const [nowLine2, setNowLine2] = useState('')

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      let h = d.getHours()
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      const mi = String(d.getMinutes()).padStart(2, '0')
      setNowLine1(`${h}:${mi} ${ampm}`)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      setNowLine2(`${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  const openIds = useMemo(() => new Set(windows.filter((w) => !w.minimized).map((w) => w.id)), [windows])

  const TooltipWrap = ({
    label,
    children,
    placement = 'top',
  }: {
    label: string
    children: ReactNode
    placement?: 'top' | 'bottom'
  }) => (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute ${placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 z-[120] hidden -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-[11px] text-white shadow-lg group-hover/tooltip:block`}
        style={{ background: 'rgba(20,20,20,0.94)' }}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  )

  return (
    <div
      id="tr-taskbar"
      className="relative z-[920] flex h-12 w-full shrink-0 items-center px-1 text-[13px]"
      style={{
        background: 'rgba(15,15,15,0.75)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.06]" />

      {/* Widgets + Start */}
      <div className="absolute left-2 flex items-center gap-1">
        <TooltipWrap label="Widgets">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200 hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation()
              setWidgets(!openWidgets)
              setQuickSettings(false)
              setActionCenter(false)
            }}
          >
            <IconWidgets size={18} />
          </button>
        </TooltipWrap>
        <TooltipWrap label="Start">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200 hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation()
              setShowStart((s) => !s)
              setSearchOverlay(false)
            }}
          >
            <IconWin11Start size={22} />
          </button>
        </TooltipWrap>
      </div>

      {/* Center cluster */}
      <div className="flex flex-1 items-center justify-center gap-1 px-[140px]">
        <TooltipWrap label="Search">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200 hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation()
              setSearchOverlay(true)
              setShowStart(false)
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" className="text-[#eaeaea]" aria-hidden>
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              />
            </svg>
          </button>
        </TooltipWrap>

        <TooltipWrap label="Task View">
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200 hover:bg-white/10 ${openTaskView ? 'bg-white/12' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setTaskView(!openTaskView)
            }}
          >
            <IconTaskView />
          </button>
        </TooltipWrap>

        <TooltipWrap label="Microsoft Edge">
          <button
            type="button"
            className={`relative flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200 hover:bg-white/10 ${openIds.has('edge-shell') ? 'after:absolute after:bottom-1 after:left-1/2 after:h-[3px] after:w-[5px] after:-translate-x-1/2 after:rounded-full after:bg-[#5ebbff]' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              openEdgeShell()
            }}
          >
            <IconEdgeLogo size={22} />
          </button>
        </TooltipWrap>

        {pinnedTools.map((t) => (
          <TooltipWrap key={t.id} label={t.label}>
            <button
              type="button"
              className={`relative flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200 hover:bg-white/10 ${openIds.has(t.id) ? 'after:absolute after:bottom-1 after:left-1/2 after:h-[3px] after:w-[5px] after:-translate-x-1/2 after:rounded-full after:bg-[#5ebbff]' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                const w = windows.find((x) => x.id === t.id)
                if (w && !w.minimized) toggleMinimize(t.id)
                else {
                  if (!w) onOpenTool(t.id)
                  else bringToFront(t.id)
                }
              }}
            >
              <t.Icon size={22} />
            </button>
          </TooltipWrap>
        ))}

        {/* Running-only buttons not pinned */}
        {windows.map((w) => {
          if (pinnedTools.some((p) => p.id === w.id)) return null
          if (['edge-shell', 'settings-app', 'notepad', 'taskmgr'].includes(w.id)) return null
          const td = allToolsById.get(w.id)
          const IconEl = td?.Icon
          const title = td?.label ?? w.title
          return (
            <TooltipWrap key={`running-${w.id}`} label={title}>
              <button
                type="button"
                title={title}
                className="relative flex h-10 max-w-[52px] min-w-[44px] items-center justify-center rounded-md border border-white/10 px-1 transition-colors duration-200 hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  if (w.minimized) bringToFront(w.id)
                  else toggleMinimize(w.id)
                }}
              >
                {IconEl ? <IconEl size={20} /> : <span className="truncate text-[10px]">{title.slice(0, 3)}</span>}
              </button>
            </TooltipWrap>
          )
        })}
      </div>

      {/* Tray */}
      <div className="absolute right-1 flex h-full items-center gap-2 pr-1">
        <button
          type="button"
          className={`flex h-9 items-center gap-2 rounded-full border px-2 transition-colors duration-200 hover:bg-white/8 ${openQuickSettings ? 'border-[#5e9bff]/50 bg-white/10' : 'border-white/10 bg-white/[0.04]'}`}
          onClick={(e) => {
            e.stopPropagation()
            setQuickSettings(!openQuickSettings)
            setWidgets(false)
          }}
          aria-label="Quick settings"
        >
          <IconWifiBars size={16} />
          <IconSpeaker size={16} />
          <IconBattery size={16} />
        </button>

        <button
          type="button"
          className="flex flex-col items-end px-2 py-0.5 leading-tight transition-colors duration-200 hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation()
            onClockClick()
          }}
        >
          <span className="text-[11px] tabular-nums text-[#f5f5f5]">{nowLine1}</span>
          <span className="text-[10px] text-[#bcbcbc]">{nowLine2}</span>
        </button>

        <TooltipWrap label="Notifications">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200 hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation()
              setActionCenter(!openActionCenter)
            }}
          >
            <IconBell size={17} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#0078d4]" aria-hidden />
          </button>
        </TooltipWrap>

        <TooltipWrap label="Settings">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md text-[#eaeaea] transition-colors duration-200 hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation()
              onOpenSettingsApp()
            }}
            aria-label="Open Settings"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
              />
            </svg>
          </button>
        </TooltipWrap>

        <TooltipWrap label={desktopClearActive ? 'Restore windows' : 'Show desktop'} placement="bottom">
          <button
            type="button"
            aria-label="Show desktop"
            className="h-full w-[4px] min-w-[4px] shrink-0 border-l border-white/15 hover:bg-[#5ebbff]/40"
            onClick={(e) => {
              e.stopPropagation()
              onShowDesktop()
            }}
          />
        </TooltipWrap>
      </div>
    </div>
  )
}
