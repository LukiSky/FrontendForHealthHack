export function nextPatientId(existingIds: string[]): string {
  let max = 2000
  for (const id of existingIds) {
    const m = /^P-(\d+)$/.exec(id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `P-${max + 1}`
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

/** Live wall-clock for the simulation header (updates via useSimClock). */
export function formatLiveClock(ms = Date.now()): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function relativeTime(iso: string, nowMs = Date.now()): string {
  const seconds = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 1000))
  if (seconds < 2) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.floor(seconds / 60)}m ago`
}
