import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PlayerProvider } from './contexts/PlayerContext'
import { GameProvider } from './contexts/GameContext'
import { EvidenceProvider } from './contexts/EvidenceContext'
import { HomeScreen } from './screens/Home/HomeScreen'
import { GameScreen } from './screens/Game/GameScreen'
import { DebriefScreen } from './screens/Debrief/DebriefScreen'
import { DashboardScreen } from './screens/Dashboard/DashboardScreen'
import { VerifyScreen } from './screens/Verify/VerifyScreen'
import { useViewportWidth } from './hooks/useViewport'

function DesktopGate({ children }: { children: ReactNode }) {
  const w = useViewportWidth()
  if (w < 1280) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#060a12] px-8 text-center text-[#e8edf5]">
        <div className="font-display text-xl">ThreatRecon OPERATIVE is designed for desktop use.</div>
        <p className="mt-4 max-w-lg font-mono text-[12px] text-[#8a9ab5]">
          Please use a display at least <span className="text-[#5e9bff]">1280px</span> wide. Current width: {w}px.
        </p>
      </div>
    )
  }
  return children
}

export default function App() {
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      if (el?.closest('[data-allow-context-menu]')) return
      e.preventDefault()
    }

    const blockKeys = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault()
        return
      }
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) {
        e.preventDefault()
        return
      }
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault()
        return
      }
    }

    document.addEventListener('contextmenu', blockContextMenu)
    document.addEventListener('keydown', blockKeys)
    return () => {
      document.removeEventListener('contextmenu', blockContextMenu)
      document.removeEventListener('keydown', blockKeys)
    }
  }, [])

  return (
    <DesktopGate>
      <PlayerProvider>
        <GameProvider>
          <EvidenceProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/game" element={<GameScreen />} />
                <Route path="/debrief" element={<DebriefScreen />} />
                <Route path="/dashboard" element={<DashboardScreen />} />
                <Route path="/verify/:id" element={<VerifyScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </EvidenceProvider>
        </GameProvider>
      </PlayerProvider>
    </DesktopGate>
  )
}
