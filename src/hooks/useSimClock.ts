import { useEffect, useState } from 'react'

/** 1 Hz wall clock so relative timestamps and countdowns refresh on screen. */
export function useSimClock(intervalMs = 1000): number {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return nowMs
}
