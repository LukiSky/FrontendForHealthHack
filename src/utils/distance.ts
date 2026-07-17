import type { Room, StaffMember } from '../state/types'

/** Clinic floor units → meters (demo scale). */
export const METERS_PER_UNIT = 2

/** Default station when staff are not in a room (lobby / nurses' station). */
export const STATION_POS = { x: 15, y: 42 }

export function roomDistanceMeters(a: Room, b: Room): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.round(Math.sqrt(dx * dx + dy * dy) * METERS_PER_UNIT)
}

export function positionOfStaff(
  staff: StaffMember,
  rooms: Room[],
): { x: number; y: number; label: string } {
  if (staff.currentRoomId) {
    const room = rooms.find((r) => r.id === staff.currentRoomId)
    if (room) return { x: room.x, y: room.y, label: room.name }
  }
  return { ...STATION_POS, label: 'Station' }
}

export function distanceFromStaffToRoom(
  staff: StaffMember,
  room: Room,
  rooms: Room[],
): number {
  const from = positionOfStaff(staff, rooms)
  const dx = from.x - room.x
  const dy = from.y - room.y
  return Math.round(Math.sqrt(dx * dx + dy * dy) * METERS_PER_UNIT)
}

export function formatDistance(meters: number): string {
  if (meters < 1) return 'Here'
  return `${meters} m`
}
