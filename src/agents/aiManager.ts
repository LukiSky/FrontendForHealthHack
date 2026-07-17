import type { Acuity, ClinicAction, ClinicState, SimulationStage } from '../state/types'
import { STATION_POS } from '../utils/distance'
import { formatLiveClock } from '../utils/ids'

function roomName(state: ClinicState, roomId: string): string {
  return state.rooms.find((r) => r.id === roomId)?.name ?? roomId
}

function recentlyThought(state: ClinicState, needle: string): boolean {
  return state.aiThoughts.slice(0, 8).some((t) => t.message.includes(needle))
}

const ACUITY_RANK: Record<Acuity, number> = {
  critical: 3,
  urgent: 2,
  routine: 1,
}

function distanceToRoom(
  room: { x: number; y: number },
  from = STATION_POS,
): number {
  const dx = room.x - from.x
  const dy = room.y - from.y
  return Math.sqrt(dx * dx + dy * dy)
}

const LIFECYCLE_TRANSITIONS: Record<
  Exclude<SimulationStage, 'waiting' | 'ready_for_discharge'>,
  {
    nextStage: SimulationStage
    carePhase: 'awaiting_vitals' | 'awaiting_exam' | 'in_consult'
    statusNote: string
    vitals?: {
      bloodPressure: string
      heartRate: string
      temperature: string
      respiratoryRate: string
      spo2: string
    }
  }
> = {
  roomed: {
    nextStage: 'vitals_recorded',
    carePhase: 'awaiting_exam',
    statusNote: 'Initial vital signs recorded — waiting for clinician assessment.',
    vitals: {
      bloodPressure: '128/82',
      heartRate: '88',
      temperature: '37.1°C',
      respiratoryRate: '18',
      spo2: '98%',
    },
  },
  vitals_recorded: {
    nextStage: 'awaiting_exam',
    carePhase: 'awaiting_exam',
    statusNote: 'Triage review complete — ready for clinician assessment.',
  },
  awaiting_exam: {
    nextStage: 'ready_for_discharge',
    carePhase: 'in_consult',
    statusNote: 'Clinical review complete — ready for clinician disposition.',
  },
}

/**
 * A deterministic patient-only simulation:
 * the agent assigns waiting patients and advances charted care stages.
 * Clinicians never move here; users control clinician locations explicitly.
 */
export function planAiTick(
  state: ClinicState,
  options: { forceAssignment?: boolean; forceLifecycle?: boolean } = {},
): ClinicAction[] {
  const actions: ClinicAction[] = []
  const clock = formatLiveClock()

  // 1) Assign one waiting patient per tick
  if (state.agentAssignEnabled !== false || options.forceAssignment) {
    const waiting = state.patients
      .filter((p) => !p.visitComplete && !p.roomId)
      .sort(
        (a, b) =>
          ACUITY_RANK[b.acuity] - ACUITY_RANK[a.acuity] ||
          a.admittedAt.localeCompare(b.admittedAt) ||
          a.id.localeCompare(b.id),
      )

    const freeRooms = state.rooms
      .filter(
        (r) =>
          r.status !== 'cleaning' &&
          !state.patients.some((p) => p.roomId === r.id && !p.visitComplete),
      )
      .sort((a, b) => distanceToRoom(a) - distanceToRoom(b))

    const next = waiting[0]
    const room = freeRooms[0]
    const assignmentReady =
      options.forceAssignment || Date.now() >= state.agentAssignmentNotBefore
    const untilAssignSec = Math.max(
      0,
      Math.ceil((state.agentAssignmentNotBefore - Date.now()) / 1000),
    )

    if (next && room && assignmentReady) {
      actions.push({
        type: 'AI_THINK',
        payload: {
          message: `${clock} Queue ready: choosing ${next.name} (${next.acuity}) for ${room.name}.`,
        },
      })
      actions.push({
        type: 'MOVE_PATIENT',
        payload: {
          patientId: next.id,
          roomId: room.id,
          by: 'agent',
        },
      })
    } else if (next && room) {
      actions.push({
        type: 'AI_THINK',
        payload: {
          message: `${clock} ${waiting.length} waiting — assigning ${next.name} in ${untilAssignSec}s → ${room.name}.`,
        },
      })
    } else if (waiting.length > 0 && freeRooms.length === 0) {
      actions.push({
        type: 'AI_THINK',
        payload: {
          message: `${clock} ${waiting.length} patient(s) waiting — no free rooms yet.`,
        },
      })
    }
  }

  // 2) Advance exactly one safe patient record at a time.
  if (
    state.agentAssignEnabled !== false &&
    (Date.now() >= state.nextSimulationAt || options.forceLifecycle)
  ) {
    const candidate = state.patients
      .filter(
        (patient) =>
          !patient.visitComplete &&
          patient.roomId &&
          !patient.lifecyclePaused &&
          !patient.chartIncomplete &&
          patient.acuity !== 'critical' &&
          patient.simulationStage &&
          patient.simulationStage in LIFECYCLE_TRANSITIONS &&
          !state.directives.some(
            (directive) =>
              directive.patientId === patient.id &&
              directive.must &&
              (directive.status === 'pending' || directive.status === 'accepted'),
          ),
      )
      .sort((a, b) =>
        (a.lifecycleUpdatedAt ?? a.admittedAt).localeCompare(b.lifecycleUpdatedAt ?? b.admittedAt),
      )[0]

    if (candidate) {
      const transition = LIFECYCLE_TRANSITIONS[candidate.simulationStage as keyof typeof LIFECYCLE_TRANSITIONS]
      if (transition) {
        const doctors = state.staff
          .filter((staff) => staff.role === 'doctor')
          .sort((a, b) => a.id.localeCompare(b.id))
        const doctor =
          doctors[
            Number(candidate.id.replace(/\D/g, '')) % Math.max(1, doctors.length)
          ]
        const room = roomName(state, candidate.roomId!)
        actions.push({
          type: 'SIMULATION_TRANSITION',
          payload: {
            patientId: candidate.id,
            expectedStage: candidate.simulationStage!,
            ...transition,
          },
        })
        if (doctor && doctor.currentRoomId !== candidate.roomId) {
          actions.push({
            type: 'SET_STAFF_LOCATION',
            payload: { staffId: doctor.id, roomId: candidate.roomId! },
          })
        }
        actions.push({
          type: 'AI_THINK',
          payload: {
            message: `${clock} AI decision: ${candidate.name} is ${candidate.acuity}; advancing ${
              candidate.simulationStage!.replace(/_/g, ' ')
            } in ${room}. ${doctor ? `${doctor.name} is moving to the room for the next review.` : ''}`,
          },
        })
      }
    }
  }

  // 3) Complete accepted must-moves once the user moves staff to the target room.
  for (const d of state.directives) {
    if (!d.must || d.status !== 'accepted') continue
    const staff = state.staff.find((s) => s.id === d.staffId)
    if (staff?.currentRoomId === d.roomId) {
      actions.push({ type: 'COMPLETE_DIRECTIVE', payload: { directiveId: d.id } })
      actions.push({
        type: 'AI_THINK',
        payload: {
          message: `${clock} Critical must-move complete: ${staff.name} arrived in ${roomName(state, d.roomId)}.`,
        },
      })
    }
  }

  // 4) Pending doctor must-moves
  for (const d of state.directives) {
    if (!d.must || d.status !== 'pending') continue
    const staff = state.staff.find((s) => s.id === d.staffId)
    const needle = `must-pending:${d.id}`
    if (recentlyThought(state, needle)) continue
    actions.push({
      type: 'AI_THINK',
      payload: {
        message: `${clock} ${needle} Waiting on ${staff?.name ?? d.staffId} to Accept critical must-move → ${roomName(state, d.roomId)}.`,
      },
    })
  }

  // 5) Idle heartbeat — keep the simulation readable when quiet.
  if (actions.length === 0) {
    const waitingCount = state.patients.filter(
      (p) => !p.visitComplete && !p.roomId,
    ).length
    actions.push({
      type: 'AI_THINK',
      payload: {
      message: `${clock} Floor scan — ${waitingCount} waiting · ${
        state.patients.filter((p) => !p.visitComplete && p.roomId).length
      } in care · simulation ${
          state.agentAssignEnabled !== false ? 'on' : 'paused'
        }.`,
      },
    })
  }

  return actions.slice(0, 5)
}
