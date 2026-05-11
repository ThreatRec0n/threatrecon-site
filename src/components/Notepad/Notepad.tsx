import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface NotepadProps {
  caseId: string
  onAppendClipboard?: (s: string) => void
}

export function Notepad({ caseId, onAppendClipboard }: NotepadProps) {
  const storageKey = `tr-notepad-${caseId}`
  const scratchKey = `tr_scratch_${caseId}`
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState(() => {
    try {
      return sessionStorage.getItem(storageKey) ?? ''
    } catch {
      return ''
    }
  })
  const [wrap, setWrap] = useState(true)
  const [showStatus, setShowStatus] = useState(true)
  const [fontPx, setFontPx] = useState(14)
  const [findOpen, setFindOpen] = useState(false)
  const [findQ, setFindQ] = useState('')
  const [zoomPct] = useState(100)

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, text)
    } catch {
      /* ignore */
    }
  }, [storageKey, text])

  const stats = useMemo(() => {
    const lines = text.split(/\r\n|\n|\r/)
    const line = lines.length
    const lastLine = lines[line - 1] ?? ''
    const col = lastLine.length + 1
    return { line, col }
  }, [text])

  const syncToInvestigationNotes = useCallback(() => {
    try {
      localStorage.setItem(scratchKey, text)
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('tr-scratchpad-sync', { detail: text }))
  }, [scratchKey, text])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        syncToInvestigationNotes()
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setFindOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [syncToInvestigationNotes])

  const menuBtn =
    'rounded px-2 py-0.5 text-[12px] text-[#e8e8e8] hover:bg-white/10 disabled:opacity-40'

  return (
    <div
      className="flex h-full flex-col bg-[#202020] text-[13px] text-[#f3f3f3]"
      style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif" }}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-black bg-[#2d2d2d] px-2 py-1">
        <span className="text-[12px] font-semibold tracking-wide text-[#ccc]">Notepad</span>
        <nav className="flex gap-1">
          <details className="relative">
            <summary className={`${menuBtn} cursor-pointer list-none`}>File</summary>
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-white/10 bg-[#323232] py-1 shadow-xl">
              <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]" onClick={() => setText('')}>
                New
              </button>
              <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]" disabled>
                Open…
              </button>
              <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]" onClick={() => syncToInvestigationNotes()}>
                Save → Investigation notes
              </button>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]"
                onClick={() => {
                  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `investigation_${caseId}.txt`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                Save As…
              </button>
              <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]" onClick={() => window.print()}>
                Print…
              </button>
            </div>
          </details>
          <details className="relative">
            <summary className={`${menuBtn} cursor-pointer list-none`}>Edit</summary>
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-white/10 bg-[#323232] py-1 shadow-xl">
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]"
                onClick={() => taRef.current?.focus()}
              >
                Undo (browser)
              </button>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]"
                onClick={() => document.execCommand('copy')}
              >
                Copy
              </button>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]"
                onClick={() => void navigator.clipboard.readText().then((t) => setText((prev) => prev + t))}
              >
                Paste
              </button>
              <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]" onClick={() => setFindOpen(true)}>
                Find… (Ctrl+F)
              </button>
            </div>
          </details>
          <details className="relative">
            <summary className={`${menuBtn} cursor-pointer list-none`}>View</summary>
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-md border border-white/10 bg-[#323232] py-1 shadow-xl">
              <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]" onClick={() => setWrap((w) => !w)}>
                Word wrap: {wrap ? 'On' : 'Off'}
              </button>
              <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]" onClick={() => setFontPx((f) => Math.min(22, f + 1))}>
                Font size +
              </button>
              <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]" onClick={() => setFontPx((f) => Math.max(11, f - 1))}>
                Font size −
              </button>
              <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-[#404040]" onClick={() => setShowStatus((s) => !s)}>
                Status bar
              </button>
            </div>
          </details>
        </nav>
      </div>

      {findOpen ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-black bg-[#252526] px-3 py-1">
          <span className="text-[11px] text-[#bbb]">Find</span>
          <input
            value={findQ}
            onChange={(e) => setFindQ(e.target.value)}
            className="flex-1 rounded border border-white/15 bg-black/40 px-2 py-1 text-[12px] outline-none"
          />
          <button type="button" className="rounded px-2 py-0.5 hover:bg-white/10" onClick={() => setFindOpen(false)}>
            ✕
          </button>
        </div>
      ) : null}

      <textarea
        ref={taRef}
        spellCheck={false}
        className={`min-h-0 flex-1 resize-none bg-[#202020] px-3 py-2 outline-none selection:bg-[#264f78]`}
        style={{
          fontFamily: 'Consolas, "Cascadia Mono", monospace',
          fontSize: fontPx,
          whiteSpace: wrap ? 'pre-wrap' : 'pre',
          overflowWrap: wrap ? 'break-word' : 'normal',
        }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPointerUp={() => {
          const sel = taRef.current
          if (!sel || !onAppendClipboard) return
          const a = sel.selectionStart ?? 0
          const b = sel.selectionEnd ?? 0
          if (b > a) onAppendClipboard(sel.value.slice(a, b))
        }}
      />

      {showStatus ? (
        <div className="flex shrink-0 items-center justify-between border-t border-black bg-[#007acc] px-2 py-0.5 text-[11px] text-white">
          <span>
            Ln {stats.line}, Col {stats.col}
          </span>
          <span>{zoomPct}%</span>
          <span>UTF-8</span>
          <span>Windows (CRLF)</span>
        </div>
      ) : null}
    </div>
  )
}
