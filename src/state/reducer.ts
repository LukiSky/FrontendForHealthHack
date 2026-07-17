import { nextLogId, nextPatientId, syncPatientIdCounter } from '../utils/ids'
import type {
  LogEntry,
  LogSource,
  Patient,
  SimulationAction,
  SimulationState,
  TriageLevel,
} from './types'

const FIRST_NAMES = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Jamie']
const LAST_NAMES = ['Nguyen', 'Smith', 'Garcia', 'Lee', 'Brown', 'Wilson', 'Martinez', 'Clark', 'Lewis', 'Young']

function now(): string {
  return new Date().toLocaleTimeString()
}

function pushLog(
  logs: LogEntry[],
  source: LogSource,
  message: string,
  agent?: string,
): LogEntry[] {
  const entry: LogEntry = {
    id: nextLogId(),
    timestamp: now(),
    source,
    agent,
    message,
  }
  const next = [...logs, entry]
  return next.length > 200 ? next.slice(-200) : next
}

function treatmentRequiredFor(level: TriageLevel): number {
  if (level === 1) return 4
  if (level === 2) return 3
  return 2
}

function clampLevel(level: number): TriageLevel {
  if (level <= 1) return 1
  if (level >= 3) return 3
  return level as TriageLevel
}

function randomName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  return `${first} ${last}`
}

function randomTriage(): TriageLevel {
  const roll = Math.random()
  if (roll < 0.15) return 1
  if (roll < 0.45) return 2
  return 3
}

function freeStaffFromRoom(state: SimulationState, roomId: string): SimulationState {
  const room = state.rooms.find((r) => r.id === roomId)
  if (!room?.staffId) return state

  return {
    ...state,
    rooms: state.rooms.map((r) =>
      r.id === roomId ? { ...r, staffId: null } : r,
    ),
    staffMembers: state.staffMembers.map((s) =>
      s.id === room.staffId
        ? { ...s, status: 'idle' as const, assignedRoomId: null }
        : s,
    ),
  }
}

function clearPatientFromRooms(state: SimulationState, patientId: string): SimulationState {
  const occupied = state.rooms.filter((r) => r.patientId === patientId)
  let next = state
  for (const room of occupied) {
    next = freeStaffFromRoom(next, room.id)
    next = {
      ...next,
      rooms: next.rooms.map((r) =>
        r.id === room.id ? { ...r, patientId: null, staffId: null } : r,
      ),
    }
  }
  return next
}

function admitPatient(
  state: SimulationState,
  id: string,
  name: string,
  triageLevel: TriageLevel,
  source: LogSource,
  agent?: string,
): SimulationState {
  if (state.patients.some((p) => p.id === id && p.status !== 'discharged')) {
    return {
      ...state,
      logs: pushLog(state.logs, 'manual', `Admit blocked: patient ${id} already active.`),
    }
  }

  syncPatientIdCounter(id)

  const patient: Patient = {
    id,
    name,
    triageLevel,
    location: 'triage',
    assignedStaffId: null,
    treatmentProgress: 0,
    treatmentRequired: treatmentRequiredFor(triageLevel),
    crashed: false,
    status: 'waiting',
  }

  return {
    ...state,
    patients: [...state.patients.filter((p) => p.id !== id), patient],
    logs: pushLog(
      state.logs,
      source,
      `Admitted ${name} (${id}) → Triage L${triageLevel}.`,
      agent,
    ),
  }
}

function runAdminAgent(state: SimulationState): SimulationState {
  if (!state.autoGeneratePatients) return state
  if (Math.random() > 0.45) return state

  const id = nextPatientId()
  const name = randomName()
  const level = randomTriage()
  return admitPatient(state, id, name, level, 'agent', 'AdminAgent')
}

function runRoomAgent(state: SimulationState): SimulationState {
  let next = state
  const waiting = next.patients
    .filter((p) => p.status === 'waiting' && p.location === 'triage')
    .sort((a, b) => a.triageLevel - b.triageLevel)

  for (const patient of waiting) {
    const emptyRoom = next.rooms.find(
      (r) => r.level === patient.triageLevel && r.patientId === null,
    )
    if (!emptyRoom) continue

    next = {
      ...next,
      rooms: next.rooms.map((r) =>
        r.id === emptyRoom.id ? { ...r, patientId: patient.id } : r,
      ),
      patients: next.patients.map((p) =>
        p.id === patient.id
          ? { ...p, location: emptyRoom.id, status: 'in_room' as const }
          : p,
      ),
      logs: pushLog(
        next.logs,
        'agent',
        `Assigned ${patient.id} to room ${emptyRoom.id}.`,
        'RoomAgent',
      ),
    }
  }
  return next
}

function runDispatchAgent(state: SimulationState): SimulationState {
  let next = state
  const unstaffed = next.rooms.filter((r) => r.patientId !== null && r.staffId === null)

  for (const room of unstaffed) {
    const idle = next.staffMembers.find((s) => s.status === 'idle')
    if (!idle) break

    next = {
      ...next,
      rooms: next.rooms.map((r) =>
        r.id === room.id ? { ...r, staffId: idle.id } : r,
      ),
      staffMembers: next.staffMembers.map((s) =>
        s.id === idle.id
          ? { ...s, status: 'busy' as const, assignedRoomId: room.id }
          : s,
      ),
      patients: next.patients.map((p) =>
        p.id === room.patientId
          ? { ...p, assignedStaffId: idle.id, status: 'treating' as const }
          : p,
      ),
      logs: pushLog(
        next.logs,
        'agent',
        `Dispatched ${idle.name} (${idle.id}) → ${room.id}.`,
        'DispatchAgent',
      ),
    }
  }
  return next
}

function runMonitoringAgent(state: SimulationState): SimulationState {
  let next = state
  const candidates = next.patients.filter(
    (p) => (p.status === 'treating' || p.status === 'in_room') && !p.crashed,
  )

  for (const patient of candidates) {
    if (Math.random() > 0.08) continue

    const newLevel = clampLevel(patient.triageLevel - 1)
    next = {
      ...next,
      patients: next.patients.map((p) =>
        p.id === patient.id
          ? {
              ...p,
              crashed: true,
              triageLevel: newLevel,
              treatmentRequired: treatmentRequiredFor(newLevel),
            }
          : p,
      ),
      logs: pushLog(
        next.logs,
        'agent',
        `HEALTH CRASH: ${patient.id} escalated to L${newLevel}.`,
        'MonitoringAgent',
      ),
    }
  }
  return next
}

function runTreatmentAgent(state: SimulationState): SimulationState {
  let next = state
  const treating = next.patients.filter(
    (p) => p.status === 'treating' && p.assignedStaffId && typeof p.location === 'string' && p.location !== 'triage',
  )

  for (const patient of treating) {
    const progress = patient.treatmentProgress + 1
    if (progress < patient.treatmentRequired) {
      next = {
        ...next,
        patients: next.patients.map((p) =>
          p.id === patient.id
            ? { ...p, treatmentProgress: progress, crashed: false }
            : p,
        ),
      }
      continue
    }

    const roomId = patient.location as string
    next = clearPatientFromRooms(next, patient.id)
    next = {
      ...next,
      patients: next.patients.map((p) =>
        p.id === patient.id
          ? {
              ...p,
              status: 'discharged' as const,
              location: 'discharged',
              assignedStaffId: null,
              treatmentProgress: progress,
              crashed: false,
            }
          : p,
      ),
      logs: pushLog(
        next.logs,
        'agent',
        `Discharged ${patient.name} (${patient.id}) from ${roomId}.`,
        'TreatmentAgent',
      ),
    }
  }
  return next
}

function runTick(state: SimulationState): SimulationState {
  let next: SimulationState = { ...state, tickCount: state.tickCount + 1 }
  next = runAdminAgent(next)
  next = runRoomAgent(next)
  next = runDispatchAgent(next)
  next = runMonitoringAgent(next)
  next = runTreatmentAgent(next)
  return next
}

export function simulationReducer(
  state: SimulationState,
  action: SimulationAction,
): SimulationState {
  switch (action.type) {
    case 'TOGGLE_PLAY':
      return {
        ...state,
        isRunning: !state.isRunning,
        logs: pushLog(
          state.logs,
          'manual',
          state.isRunning ? 'Simulation paused.' : 'Simulation resumed.',
        ),
      }

    case 'TOGGLE_AUTO_GENERATE':
      return {
        ...state,
        autoGeneratePatients: !state.autoGeneratePatients,
        logs: pushLog(
          state.logs,
          'manual',
          !state.autoGeneratePatients
            ? 'Auto-generate patients ON.'
            : 'Auto-generate patients OFF — admin has full intake control.',
        ),
      }

    case 'ADMIT_PATIENT': {
      const { id, name, triageLevel } = action.payload
      return admitPatient(state, id, name.trim() || 'Unknown', triageLevel, 'manual')
    }

    case 'MOVE_PATIENT': {
      const { patientId, roomId } = action.payload
      const patient = state.patients.find((p) => p.id === patientId)
      const target = state.rooms.find((r) => r.id === roomId)
      if (!patient || patient.status === 'discharged' || !target) return state
      if (target.patientId && target.patientId !== patientId) {
        return {
          ...state,
          logs: pushLog(state.logs, 'manual', `Move blocked: ${roomId} is occupied.`),
        }
      }

      let next = clearPatientFromRooms(state, patientId)
      next = {
        ...next,
        rooms: next.rooms.map((r) =>
          r.id === roomId ? { ...r, patientId } : r,
        ),
        patients: next.patients.map((p) =>
          p.id === patientId
            ? {
                ...p,
                location: roomId,
                status: 'in_room' as const,
                assignedStaffId: null,
                crashed: false,
              }
            : p,
        ),
        logs: pushLog(
          next.logs,
          'manual',
          `Manual relocate: ${patientId} → ${roomId}.`,
        ),
      }
      return next
    }

    case 'ESCALATE': {
      const patient = state.patients.find((p) => p.id === action.payload.patientId)
      if (!patient || patient.status === 'discharged') return state
      const newLevel = clampLevel(patient.triageLevel - 1)
      if (newLevel === patient.triageLevel) return state
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === patient.id
            ? {
                ...p,
                triageLevel: newLevel,
                treatmentRequired: treatmentRequiredFor(newLevel),
                crashed: true,
              }
            : p,
        ),
        logs: pushLog(
          state.logs,
          'manual',
          `Manual escalate: ${patient.id} → L${newLevel}.`,
        ),
      }
    }

    case 'DEESCALATE': {
      const patient = state.patients.find((p) => p.id === action.payload.patientId)
      if (!patient || patient.status === 'discharged') return state
      const newLevel = clampLevel(patient.triageLevel + 1)
      if (newLevel === patient.triageLevel) return state
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === patient.id
            ? {
                ...p,
                triageLevel: newLevel,
                treatmentRequired: treatmentRequiredFor(newLevel),
                crashed: false,
              }
            : p,
        ),
        logs: pushLog(
          state.logs,
          'manual',
          `Manual de-escalate: ${patient.id} → L${newLevel}.`,
        ),
      }
    }

    case 'ASSIGN_SELF': {
      const { patientId } = action.payload
      const patient = state.patients.find((p) => p.id === patientId)
      const self = state.staffMembers.find((s) => s.id === state.activeStaffId)
      if (!patient || patient.status === 'discharged' || !self) return state
      if (patient.location === 'triage' || patient.location === 'discharged') {
        return {
          ...state,
          logs: pushLog(
            state.logs,
            'manual',
            `Assign Self blocked: ${patientId} is not in a room.`,
          ),
        }
      }

      const roomId = patient.location as string
      let next = state

      // Free previous staff on this room
      next = freeStaffFromRoom(next, roomId)

      // Free self from any other room
      if (self.assignedRoomId && self.assignedRoomId !== roomId) {
        next = freeStaffFromRoom(next, self.assignedRoomId)
        next = {
          ...next,
          rooms: next.rooms.map((r) =>
            r.id === self.assignedRoomId ? { ...r, staffId: null } : r,
          ),
          patients: next.patients.map((p) =>
            p.assignedStaffId === self.id
              ? { ...p, assignedStaffId: null, status: p.location === 'triage' ? 'waiting' : 'in_room' }
              : p,
          ),
        }
      }

      next = {
        ...next,
        rooms: next.rooms.map((r) =>
          r.id === roomId ? { ...r, staffId: self.id } : r,
        ),
        staffMembers: next.staffMembers.map((s) =>
          s.id === self.id
            ? { ...s, status: 'busy' as const, assignedRoomId: roomId }
            : s,
        ),
        patients: next.patients.map((p) =>
          p.id === patientId
            ? { ...p, assignedStaffId: self.id, status: 'treating' as const }
            : p,
        ),
        logs: pushLog(
          next.logs,
          'manual',
          `${self.name} took over ${patientId} in ${roomId} (AI override).`,
        ),
      }
      return next
    }

    case 'TICK':
      return runTick(state)

    default:
      return state
  }
}
