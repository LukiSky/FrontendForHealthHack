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
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}
