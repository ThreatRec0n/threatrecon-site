import { useState } from 'react'
import { useGame } from '../../contexts/GameContext'

export function FileExplorer() {
  const { vfs, caseDef } = useGame()
  const [path, setPath] = useState(() => vfs?.getCurrentPath() ?? 'C:\\')
  if (!vfs || !caseDef) return null

  const listing = vfs.ls(path, [])
  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] text-xs font-mono text-[#e8edf5]">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <span className="text-[#8a9ab5]">Path</span>
        <input
          className="flex-1 rounded border border-white/10 bg-black/30 px-2 py-1"
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
      </div>
      <pre className="flex-1 overflow-auto p-3 whitespace-pre-wrap">{listing}</pre>
    </div>
  )
}
