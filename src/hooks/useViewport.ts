import { useEffect, useState } from 'react'

export function useViewportWidth(): number {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920)
  useEffect(() => {
    const onResize = () => setW(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return w
}
