import { format } from 'date-fns'

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const kb = n / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

export function formatWinDate(ts: number): string {
  return format(new Date(ts), 'MM/dd/yyyy  hh:mm a')
}

export function formatIso(ts: number): string {
  return new Date(ts).toISOString().replace('T', ' ').slice(0, 19)
}

export function padLine(s: string, width: number): string {
  return s.length >= width ? s.slice(0, width) : s + ' '.repeat(width - s.length)
}
