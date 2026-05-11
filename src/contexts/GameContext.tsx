import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CaseDefinition } from '../types/case.types'
import type { CaseGenerationInput } from '../types/case.types'
import type { Difficulty } from '../types/player.types'
import { CaseEngine } from '../engine/CaseEngine'
import { VirtualFileSystem } from '../engine/VirtualFileSystem'
import { VirtualRegistry } from '../engine/VirtualRegistry'
import { VirtualFirewall } from '../engine/VirtualFirewall'
import { ShellInterpreter } from '../engine/ShellInterpreter'
import { AttackerStateMachine, adaptationMsForDifficulty } from '../engine/AttackerStateMachine'
import { ForensicIntegrityEngine } from '../engine/ForensicIntegrityEngine'

export type GamePhase = 'detect' | 'hunt' | 'eradicate' | 'harden' | 'report'

export interface GameContextValue {
  caseDef: CaseDefinition | null
  vfs: VirtualFileSystem | null
  registry: VirtualRegistry | null
  firewall: VirtualFirewall | null
  phase: GamePhase
  setPhase: (p: GamePhase) => void
  timerRemaining: number
  timerTotal: number
  difficulty: Difficulty | null
  toolsOpened: boolean
  markToolsOpened: () => void
  startCase: (input: CaseGenerationInput & { difficulty: Difficulty }) => void
  resetCase: () => void
  createShell: () => ShellInterpreter
  attacker: AttackerStateMachine | null
  forensic: ForensicIntegrityEngine
  hardeningDone: Record<string, boolean>
  toggleHardening: (id: string) => void
  timeUp: boolean
  exfilProgress: number /* 0..1; >0 means exfil in progress */
  exfilWarned: boolean
  exfilBlocked: boolean
  markExfilBlocked: () => void
  /** Player actions issued during the run, used by debrief timeline. */
  playerEvents: { at: number; offsetSec: number; kind: string; detail: string }[]
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [caseDef, setCaseDef] = useState<CaseDefinition | null>(null)
  const [vfs, setVfs] = useState<VirtualFileSystem | null>(null)
  const [registry, setRegistry] = useState<VirtualRegistry | null>(null)
  const [firewall, setFirewall] = useState<VirtualFirewall | null>(null)
  const [phase, setPhase] = useState<GamePhase>('detect')
  const [timerRemaining, setTimerRemaining] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [toolsOpened, setToolsOpened] = useState(false)
  const [attacker, setAttacker] = useState<AttackerStateMachine | null>(null)
  const attackerRef = useRef<AttackerStateMachine | null>(null)
  const forensicRef = useRef(new ForensicIntegrityEngine())
  const [hardeningDone, setHardeningDone] = useState<Record<string, boolean>>({})
  const [timeUp, setTimeUp] = useState(false)
  const [exfilProgress, setExfilProgress] = useState(0)
  const [exfilWarned, setExfilWarned] = useState(false)
  const [exfilBlocked, setExfilBlocked] = useState(false)
  const playerEventsRef = useRef<{ at: number; offsetSec: number; kind: string; detail: string }[]>([])
  const startedAtRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!attacker) return
    const id = window.setInterval(() => attacker.tick(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [attacker])

  useEffect(() => {
    if (!caseDef || timerRemaining <= 0) return
    const id = window.setInterval(() => {
      setTimerRemaining((s) => {
        if (s <= 1) {
          setTimeUp(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [caseDef, timerRemaining])

  /* Incident Commander exfil warning + progress */
  useEffect(() => {
    if (!caseDef || !difficulty) return
    if (difficulty !== 'incident_commander') return
    const triggerAtRemaining = caseDef.commanderExfilAtRemainingSeconds ?? 600
    if (exfilBlocked) return
    if (timerRemaining <= triggerAtRemaining && !exfilWarned) setExfilWarned(true)
    if (exfilWarned) {
      const elapsedSinceWarn = triggerAtRemaining - timerRemaining
      const next = Math.max(0, Math.min(1, elapsedSinceWarn / triggerAtRemaining))
      setExfilProgress(next)
    }
  }, [timerRemaining, caseDef, difficulty, exfilWarned, exfilBlocked])

  const markExfilBlocked = useCallback(() => {
    setExfilBlocked(true)
  }, [])

  const startCase = useCallback((input: CaseGenerationInput & { difficulty: Difficulty }) => {
    setTimeUp(false)
    setExfilWarned(false)
    setExfilBlocked(false)
    setExfilProgress(0)
    setDifficulty(input.difficulty)
    const result = CaseEngine.generate(input)
    setCaseDef(result.case)
    setVfs(result.vfs)
    setRegistry(result.registry)
    setFirewall(new VirtualFirewall())
    setTimerTotal(result.case.timerSeconds)
    setTimerRemaining(result.case.timerSeconds)
    setPhase('detect')
    setToolsOpened(false)
    setHardeningDone({})
    forensicRef.current = new ForensicIntegrityEngine()
    playerEventsRef.current = []
    startedAtRef.current = Date.now()
    const sm = new AttackerStateMachine(result.case, adaptationMsForDifficulty(input.difficulty))
    attackerRef.current = sm
    setAttacker(sm)
  }, [])

  const resetCase = useCallback(() => {
    setCaseDef(null)
    setVfs(null)
    setRegistry(null)
    setFirewall(null)
    setTimerRemaining(0)
    setTimerTotal(0)
    setPhase('detect')
    setToolsOpened(false)
    attackerRef.current = null
    setAttacker(null)
    setTimeUp(false)
    setExfilWarned(false)
    setExfilBlocked(false)
    setExfilProgress(0)
    playerEventsRef.current = []
  }, [])

  const markToolsOpened = useCallback(() => {
    setToolsOpened(true)
    setPhase((p) => (p === 'detect' ? 'hunt' : p))
  }, [])

  const createShell = useCallback(() => {
    if (!vfs || !caseDef || !registry || !firewall) throw new Error('No active case')
    return new ShellInterpreter(vfs, caseDef, registry, firewall, forensicRef.current, (raw) => {
      attackerRef.current?.onPlayerAction({ kind: 'terminal_command', detail: raw, at: Date.now() })
      playerEventsRef.current.push({
        at: Date.now(),
        offsetSec: Math.floor((Date.now() - startedAtRef.current) / 1000),
        kind: 'terminal_command',
        detail: raw,
      })
      /* exfil block detection */
      const lower = raw.toLowerCase()
      const c2 = caseDef.c2Ip
      if (c2 && (lower.includes(`block`) && lower.includes(c2))) markExfilBlocked()
      if (c2 && lower.includes('netsh advfirewall firewall add rule') && lower.includes(c2)) markExfilBlocked()
      if (lower.includes('taskkill') && lower.match(/\b\d{3,6}\b/)) {
        const pid = Number(lower.match(/\b\d{3,6}\b/)?.[0])
        const mal = caseDef.processes.find((p) => p.pid === pid && p.malicious)
        if (mal) markExfilBlocked()
      }
    })
  }, [vfs, caseDef, registry, firewall, markExfilBlocked])

  const toggleHardening = useCallback((id: string) => {
    setHardeningDone((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const value = useMemo<GameContextValue>(
    () => ({
      caseDef,
      vfs,
      registry,
      firewall,
      phase,
      setPhase,
      timerRemaining,
      timerTotal,
      difficulty,
      toolsOpened,
      markToolsOpened,
      startCase,
      resetCase,
      createShell,
      attacker,
      forensic: forensicRef.current,
      hardeningDone,
      toggleHardening,
      timeUp,
      exfilProgress,
      exfilWarned,
      exfilBlocked,
      markExfilBlocked,
      playerEvents: playerEventsRef.current,
    }),
    [
      caseDef,
      vfs,
      registry,
      firewall,
      phase,
      timerRemaining,
      timerTotal,
      difficulty,
      toolsOpened,
      markToolsOpened,
      startCase,
      resetCase,
      createShell,
      attacker,
      hardeningDone,
      toggleHardening,
      timeUp,
      exfilProgress,
      exfilWarned,
      exfilBlocked,
      markExfilBlocked,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame requires GameProvider')
  return ctx
}
