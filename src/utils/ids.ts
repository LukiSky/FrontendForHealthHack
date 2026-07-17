let patientCounter = 1000
let staffCounter = 0
let logCounter = 0

export function nextPatientId(): string {
  patientCounter += 1
  return `P-${patientCounter}`
}

export function peekNextPatientId(): string {
  return `P-${patientCounter + 1}`
}

/** Advance the auto counter past a used ID when it matches the P-NNNN pattern. */
export function syncPatientIdCounter(id: string): void {
  const match = /^P-(\d+)$/.exec(id)
  if (!match) return
  const num = Number(match[1])
  if (num > patientCounter) patientCounter = num
}

export function nextStaffId(role: 'doctor' | 'nurse'): string {
  staffCounter += 1
  const prefix = role === 'doctor' ? 'DR' : 'RN'
  return `${prefix}-${String(staffCounter).padStart(2, '0')}`
}

export function nextLogId(): string {
  logCounter += 1
  return `log-${logCounter}`
}

export function resetIdCounters(): void {
  patientCounter = 1000
  staffCounter = 0
  logCounter = 0
}
