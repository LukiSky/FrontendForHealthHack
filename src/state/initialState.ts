import { nextStaffId, resetIdCounters } from '../utils/ids'
import type { Room, SimulationState, StaffMember, TriageLevel } from './types'

const ROOM_COUNTS = { L1: 10, L2: 10, L3: 10 } as const
const STAFF_COUNTS = { doctors: 5, nurses: 8 } as const

function buildRooms(): Room[] {
  const rooms: Room[] = []
  const levels: TriageLevel[] = [1, 2, 3]
  for (const level of levels) {
    const count = ROOM_COUNTS[`L${level}` as keyof typeof ROOM_COUNTS]
    for (let i = 1; i <= count; i++) {
      rooms.push({
        id: `L${level}-R${String(i).padStart(2, '0')}`,
        level,
        patientId: null,
        staffId: null,
      })
    }
  }
  return rooms
}

function buildStaff(): StaffMember[] {
  resetIdCounters()
  const members: StaffMember[] = []
  for (let i = 0; i < STAFF_COUNTS.doctors; i++) {
    const id = nextStaffId('doctor')
    members.push({
      id,
      name: `Dr. ${['Chen', 'Patel', 'Reyes', 'Kim', 'Walsh'][i] ?? `Staff${i}`}`,
      role: 'doctor',
      status: 'idle',
      assignedRoomId: null,
    })
  }
  for (let i = 0; i < STAFF_COUNTS.nurses; i++) {
    const id = nextStaffId('nurse')
    members.push({
      id,
      name: `Nurse ${['Adams', 'Brooks', 'Diaz', 'Ellis', 'Ford', 'Grant', 'Hayes', 'Ivy'][i] ?? `Staff${i}`}`,
      role: 'nurse',
      status: 'idle',
      assignedRoomId: null,
    })
  }
  return members
}

export function createInitialState(): SimulationState {
  const staffMembers = buildStaff()
  return {
    rooms: buildRooms(),
    staffMembers,
    patients: [],
    logs: [
      {
        id: 'log-boot',
        timestamp: new Date().toLocaleTimeString(),
        source: 'agent',
        agent: 'System',
        message: 'EMR Triage Simulator online. 30 rooms · 5 doctors · 8 nurses ready.',
      },
    ],
    tickRateMs: 1500,
    isRunning: true,
    autoGeneratePatients: true,
    tickCount: 0,
    activeStaffId: staffMembers[0]?.id ?? 'DR-01',
  }
}

export const initialValues = {
  rooms: ROOM_COUNTS,
  staff: STAFF_COUNTS,
  patients: [] as never[],
  tickRateMs: 1500,
}
