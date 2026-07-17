import type { Room, StaffMember } from '../state/types'

/** Clinic floor units → meters (demo scale). */
export const METERS_PER_UNIT = 2

/**
 * Nurses’ station / lobby anchor (below the 5×6 room grid).
 * Room grid: x 0–70, y 0–56.
 */
export const STATION_POS = { x: 35, y: 72 }

/** Waiting bay on the floor plan (left of station). */
export const WAITING_POS = { x: -16, y: 72 }

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
