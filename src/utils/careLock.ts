import type { Patient, StaffMember } from '../state/types'

export type CareLock = {
  roomId: string
  patient: Patient
}

/** Once staff takes care of a patient, they stay locked to that room until Update care finishes. */
export function getCareLock(
  staff: StaffMember | null | undefined,
  patients: Patient[],
): CareLock | null {
  if (!staff || staff.role === 'admin' || !staff.currentRoomId) return null
  const patient = patients.find(
    (p) => p.roomId === staff.currentRoomId && !p.visitComplete,
  )
  if (!patient) return null
  return { roomId: staff.currentRoomId, patient }
}

export function isPathAllowedUnderCareLock(pathname: string, roomId: string): boolean {
  return (
    pathname === `/room/${roomId}` ||
    pathname.startsWith(`/room/${roomId}/`)
  )
}
