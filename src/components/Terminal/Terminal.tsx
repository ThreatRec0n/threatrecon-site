import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { SearchAddon } from '@xterm/addon-search'
import '@xterm/xterm/css/xterm.css'
import { ShellInterpreter } from '../../engine/ShellInterpreter'

const theme = {
  background: '#0a0e1a',
  foreground: '#c8d6e8',
  cursor: '#5e9bff',
  cursorAccent: '#0a0e1a',
  selectionBackground: 'rgba(94,155,255,0.3)',
  black: '#1a2436',
  red: '#ff3b3b',
  green: '#00d97e',
  yellow: '#ffaa00',
  blue: '#5e9bff',
  magenta: '#b48eff',
  cyan: '#00d0ff',
  white: '#c8d6e8',
  brightBlack: '#2d3a4a',
  brightRed: '#ff6b6b',
  brightGreen: '#3df5a0',
  brightYellow: '#ffc94d',
  brightBlue: '#7bb2ff',
  brightMagenta: '#c8a8ff',
  brightCyan: '#4de8ff',
  brightWhite: '#e8edf5',
}

interface State {
  buf: string
  cursor: number /* index within buf */
  promptLen: number
  history: string[]
  histIdx: number
  lastTab: number
}

export function TerminalWindow({
  createShell,
  initialBanner,
}: {
  createShell: () => ShellInterpreter
  initialBanner?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<ShellInterpreter | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const shell = createShell()
    shellRef.current = shell
    const term = new XTerm({
      theme,
      fontFamily: "'Geist Mono', 'Cascadia Code', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowTransparency: true,
      convertEol: false,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.loadAddon(new WebLinksAddon())
    term.loadAddon(new SearchAddon())
    term.open(el)
    requestAnimationFrame(() => {
      fit.fit()
      term.focus()
    })

    /* Ensure clicks anywhere in the container give xterm focus */
    const focusHandler = () => term.focus()
    el.addEventListener('mousedown', focusHandler)
    el.addEventListener('click', focusHandler)

    const state: State = {
      buf: '',
      cursor: 0,
      promptLen: 0,
      history: [],
      histIdx: 0,
      lastTab: 0,
    }

    const writePrompt = () => {
      const prompt = shell.prompt()
      term.write(prompt)
      const visible = stripAnsi(prompt)
      state.promptLen = visible.length
      state.buf = ''
      state.cursor = 0
    }

    const redrawLine = () => {
      /* move cursor to start of buf, clear to end of line, rewrite buf, place cursor */
      term.write('\r' + ' '.repeat(state.promptLen + state.buf.length + 8) + '\r')
      term.write(shell.prompt())
      term.write(state.buf)
      const back = state.buf.length - state.cursor
      if (back > 0) term.write(`\x1b[${back}D`)
    }

    const replaceLine = (newBuf: string) => {
      state.buf = newBuf
      state.cursor = newBuf.length
      redrawLine()
    }

    const insertChars = (data: string) => {
      const before = state.buf.slice(0, state.cursor)
      const after = state.buf.slice(state.cursor)
      state.buf = before + data + after
      state.cursor += data.length
      if (after) {
        term.write(data + after + `\x1b[${after.length}D`)
      } else {
        term.write(data)
      }
    }

    const handleEnter = () => {
      const cmd = state.buf
      term.write('\r\n')
      if (cmd.trim()) {
        state.history.push(cmd)
      }
      state.histIdx = state.history.length
      const out = shell.execute(cmd)
      if (out === '\x1b[2J\x1b[H') {
        term.write(out)
      } else if (out) {
        term.write(out)
        if (!out.endsWith('\r\n') && !out.endsWith('\n')) term.write('\r\n')
      }
      writePrompt()
    }

    const handleBackspace = () => {
      if (state.cursor === 0) return
      state.buf = state.buf.slice(0, state.cursor - 1) + state.buf.slice(state.cursor)
      state.cursor--
      redrawLine()
    }

    const handleDelete = () => {
      if (state.cursor >= state.buf.length) return
      state.buf = state.buf.slice(0, state.cursor) + state.buf.slice(state.cursor + 1)
      redrawLine()
    }

    const handleArrowLeft = () => {
      if (state.cursor === 0) return
      state.cursor--
      term.write('\x1b[D')
    }

    const handleArrowRight = () => {
      if (state.cursor >= state.buf.length) return
      state.cursor++
      term.write('\x1b[C')
    }

    const handleHistoryUp = () => {
      if (!state.history.length) return
      state.histIdx = Math.max(0, state.histIdx - 1)
      replaceLine(state.history[state.histIdx] ?? '')
    }

    const handleHistoryDown = () => {
      if (!state.history.length) return
      if (state.histIdx >= state.history.length) return
      state.histIdx = Math.min(state.history.length, state.histIdx + 1)
      replaceLine(state.history[state.histIdx] ?? '')
    }

    const handleHome = () => {
      if (state.cursor === 0) return
      term.write(`\x1b[${state.cursor}D`)
      state.cursor = 0
    }

    const handleEnd = () => {
      if (state.cursor >= state.buf.length) return
      term.write(`\x1b[${state.buf.length - state.cursor}C`)
      state.cursor = state.buf.length
    }

    const handleCtrlU = () => {
      const remaining = state.buf.slice(state.cursor)
      state.buf = remaining
      state.cursor = 0
      redrawLine()
    }

    const handleCtrlK = () => {
      state.buf = state.buf.slice(0, state.cursor)
      redrawLine()
    }

    const handleCtrlW = () => {
      const before = state.buf.slice(0, state.cursor)
      const after = state.buf.slice(state.cursor)
      const trimmed = before.replace(/\S+\s*$/, '')
      state.buf = trimmed + after
      state.cursor = trimmed.length
      redrawLine()
    }

    const handleTab = () => {
      const beforeCursor = state.buf.slice(0, state.cursor)
      const tokens = beforeCursor.split(/\s+/)
      const last = tokens[tokens.length - 1] ?? ''
      const isCommandSlot = tokens.length === 1
      let candidates: string[] = []
      if (isCommandSlot) {
        const lower = last.toLowerCase()
        candidates = shell.knownCommands().filter((c) => c.toLowerCase().startsWith(lower))
      } else {
        candidates = shell.pathCompletions(last)
      }

      if (candidates.length === 0) return
      if (candidates.length === 1) {
        const completion = candidates[0]!.slice(last.length)
        insertChars(completion)
        return
      }

      const common = longestCommonPrefix(candidates)
      if (common.length > last.length) {
        insertChars(common.slice(last.length))
        return
      }
      const now = Date.now()
      if (now - state.lastTab < 600) {
        term.write('\r\n' + candidates.join('  ') + '\r\n')
        writePrompt()
        if (state.buf) term.write(state.buf)
      }
      state.lastTab = now
    }

    const handleCtrlC = () => {
      term.write('^C\r\n')
      state.buf = ''
      state.cursor = 0
      writePrompt()
    }

    const handleCtrlL = () => {
      term.write('\x1b[2J\x1b[H')
      writePrompt()
    }

    if (initialBanner) {
      term.write(initialBanner.replace(/\n/g, '\r\n'))
      if (!initialBanner.endsWith('\n')) term.write('\r\n')
    }
    writePrompt()

    const onData = (data: string) => {
      /* Single keystrokes */
      if (data === '\r') {
        handleEnter()
        return
      }
      if (data === '\x7f' || data === '\b') {
        handleBackspace()
        return
      }
      if (data === '\t') {
        handleTab()
        return
      }
      if (data === '\x03') {
        handleCtrlC()
        return
      }
      if (data === '\x0c') {
        handleCtrlL()
        return
      }
      if (data === '\x01') {
        handleHome()
        return
      }
      if (data === '\x05') {
        handleEnd()
        return
      }
      if (data === '\x15') {
        handleCtrlU()
        return
      }
      if (data === '\x0b') {
        handleCtrlK()
        return
      }
      if (data === '\x17') {
        handleCtrlW()
        return
      }
      /* CSI sequences */
      if (data.startsWith('\x1b[') || data.startsWith('\x1bO')) {
        const code = data.slice(2)
        if (code === 'A') return handleHistoryUp()
        if (code === 'B') return handleHistoryDown()
        if (code === 'D') return handleArrowLeft()
        if (code === 'C') return handleArrowRight()
        if (code === 'H' || code === '1~') return handleHome()
        if (code === 'F' || code === '4~') return handleEnd()
        if (code === '3~') return handleDelete()
        return
      }
      /* Filter remaining control chars */
      if (data.charCodeAt(0) < 32) return
      insertChars(data)
    }

    const dataDisp = term.onData(onData)
    const ro = new ResizeObserver(() => {
      try {
        fit.fit()
      } catch {
        /* terminal disposed */
      }
    })
    ro.observe(el)

    return () => {
      el.removeEventListener('mousedown', focusHandler)
      el.removeEventListener('click', focusHandler)
      dataDisp.dispose()
      ro.disconnect()
      term.dispose()
    }
  }, [createShell])

  return (
    <div
      ref={containerRef}
      className="h-full w-full min-h-[320px] rounded-md border border-white/10 bg-[#0a0e1a] p-1"
    />
  )
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
}

function longestCommonPrefix(arr: string[]): string {
  if (!arr.length) return ''
  let prefix = arr[0]!
  for (let i = 1; i < arr.length; i++) {
    while (!arr[i]!.toLowerCase().startsWith(prefix.toLowerCase())) {
      prefix = prefix.slice(0, -1)
      if (!prefix) return ''
    }
  }
  return prefix
}
