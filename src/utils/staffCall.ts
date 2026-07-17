import type { Room, StaffMember, StaffRole } from '../state/types'
import { distanceFromStaffToRoom } from './distance'

export type StaffNeedType =
  | { kind: 'nurse' }
  | { kind: 'doctor'; specialty?: string }

export type StaffNeedOption = {
  id: string
  label: string
  need: StaffNeedType
  availableCount: number
}

/** Build call options from who exists on the roster (not specific names). */
export function buildStaffNeedOptions(
  staff: StaffMember[],
  excludeId?: string,
): StaffNeedOption[] {
  const pool = staff.filter(
    (s) =>
      (s.role === 'doctor' || s.role === 'nurse') && s.id !== excludeId,
  )
  const nurses = pool.filter((s) => s.role === 'nurse')
  const doctors = pool.filter((s) => s.role === 'doctor')
  const freeNurses = nurses.filter((s) => !s.currentRoomId).length
  const freeDoctors = doctors.filter((s) => !s.currentRoomId).length

  const options: StaffNeedOption[] = [
    {
      id: 'nurse',
      label: 'Nurse',
      need: { kind: 'nurse' },
      availableCount: freeNurses,
    },
    {
      id: 'doctor-any',
      label: 'Any doctor',
      need: { kind: 'doctor' },
      availableCount: freeDoctors,
    },
  ]

  const specialties = [...new Set(doctors.map((d) => d.specialty))].sort()
  for (const specialty of specialties) {
    const matching = doctors.filter((d) => d.specialty === specialty)
    const free = matching.filter((d) => !d.currentRoomId).length
    options.push({
      id: `doctor-${specialty}`,
      label: `${specialty} doctor`,
      need: { kind: 'doctor', specialty },
      availableCount: free,
    })
  }

  return options
}

/** Pick best staff for a need: free first, then closest to the room. */
export function pickStaffForNeed(
  staff: StaffMember[],
  rooms: Room[],
  room: Room,
  need: StaffNeedType,
  excludeId?: string,
): StaffMember | null {
  let candidates = staff.filter(
    (s) =>
      s.id !== excludeId &&
      s.role !== 'admin' &&
      matchesNeed(s, need),
  )
  if (candidates.length === 0) return null

  candidates = [...candidates].sort((a, b) => {
    const aFree = a.currentRoomId ? 1 : 0
    const bFree = b.currentRoomId ? 1 : 0
    if (aFree !== bFree) return aFree - bFree
    return (
      distanceFromStaffToRoom(a, room, rooms) -
      distanceFromStaffToRoom(b, room, rooms)
    )
  })

  return candidates[0] ?? null
}

function matchesNeed(s: StaffMember, need: StaffNeedType): boolean {
  if (need.kind === 'nurse') return s.role === 'nurse'
  if (s.role !== 'doctor') return false
  if (!need.specialty) return true
  return s.specialty === need.specialty
}

export function roleLabel(role: StaffRole): string {
  if (role === 'nurse') return 'nurse'
  if (role === 'doctor') return 'doctor'
  return role
}

export const CALL_WHY_OPTIONS = [
  'Need hands immediately',
  'Unstable patient',
  'Need vitals / nurse assist',
  'Need specialty consult',
  'Procedure help',
  'Extra coverage in this room',
] as const

export type CallWhy = (typeof CALL_WHY_OPTIONS)[number]
