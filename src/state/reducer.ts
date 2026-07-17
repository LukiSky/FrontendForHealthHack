import type {
  AiDirective,
  AiThought,
  CarePhase,
  ClinicAction,
  ClinicState,
  RoomStatus,
} from './types'

function roomStatusFromPatients(
  rooms: ClinicState['rooms'],
  patients: ClinicState['patients'],
): ClinicState['rooms'] {
  return rooms.map((room) => {
    if (room.status === 'cleaning') return room
    const occupied = patients.some(
      (p) => p.roomId === room.id && !p.visitComplete,
    )
    const status: RoomStatus = occupied ? 'occupied' : 'available'
    return { ...room, status }
  })
}

function stamp(): string {
  return new Date().toISOString()
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function pushThought(thoughts: AiThought[], message: string): AiThought[] {
  return [{ id: uid('thought'), at: stamp(), message }, ...thoughts].slice(0, 50)
}

export function clinicReducer(state: ClinicState, action: ClinicAction): ClinicState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...action.payload,
        directives: action.payload.directives ?? [],
        aiThoughts: action.payload.aiThoughts ?? [],
      }

    case 'AI_BATCH': {
      let next = state
      for (const a of action.payload) {
        next = clinicReducer(next, a)
      }
      return next
    }

    case 'SET_VIEWING_AS':
      return {
        ...state,
        viewingAs: action.payload.viewingAs,
        version: state.version + 1,
      }

    case 'SET_STAFF_LOCATION': {
      const { staffId, roomId } = action.payload
      return {
        ...state,
        staff: state.staff.map((s) =>
          s.id === staffId ? { ...s, currentRoomId: roomId } : s,
        ),
        version: state.version + 1,
      }
    }

    case 'SET_ROOM_STATUS': {
      const { roomId, status } = action.payload
      return {
        ...state,
        rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, status } : r)),
        version: state.version + 1,
      }
    }

    case 'AI_THINK':
      return {
        ...state,
        aiThoughts: pushThought(state.aiThoughts, action.payload.message),
        version: state.version + 1,
      }

    case 'ISSUE_DIRECTIVE': {
      const p = action.payload
      const id = p.id ?? uid('dir')
      // Supersede other pending directives for same staff or same patient+phase
      const directives = state.directives.map((d) => {
        if (d.status !== 'pending' && d.status !== 'accepted') return d
        if (d.staffId === p.staffId || (d.patientId === p.patientId && d.phase === p.phase)) {
          return { ...d, status: 'superseded' as const }
        }
        return d
      })
      const directive: AiDirective = {
        id,
        staffId: p.staffId,
        roomId: p.roomId,
        patientId: p.patientId,
        priority: p.priority,
        title: p.title,
        reason: p.reason,
        phase: p.phase,
        status: p.status ?? 'pending',
        createdAt: stamp(),
        must: p.must ?? false,
      }
      return {
        ...state,
        directives: [directive, ...directives].slice(0, 80),
        staff: state.staff.map((s) =>
          s.id === p.staffId ? { ...s, currentTaskId: id } : s,
        ),
        version: state.version + 1,
      }
    }

    case 'ACCEPT_DIRECTIVE': {
      const d = state.directives.find((x) => x.id === action.payload.directiveId)
      if (!d || (d.status !== 'pending' && d.status !== 'accepted')) return state
      const room = state.rooms.find((r) => r.id === d.roomId)
      return {
        ...state,
        directives: state.directives.map((x) =>
          x.id === d.id ? { ...x, status: 'accepted' as const } : x,
        ),
        staff: state.staff.map((s) =>
          s.id === d.staffId
            ? { ...s, currentRoomId: d.roomId, currentTaskId: d.id }
            : s,
        ),
        patients: state.patients.map((p) => {
          if (p.id !== d.patientId) return p
          let carePhase: CarePhase = p.carePhase
          if (d.phase === 'exam') carePhase = 'in_consult'
          return { ...p, carePhase }
        }),
        aiThoughts: pushThought(
          state.aiThoughts,
          `Accepted: ${state.staff.find((s) => s.id === d.staffId)?.name ?? d.staffId} → ${room?.name ?? d.roomId}`,
        ),
        activity: [
          {
            id: uid('act'),
            at: stamp(),
            staffId: d.staffId,
            patientId: d.patientId,
            patientName: state.patients.find((p) => p.id === d.patientId)?.name ?? '',
            action: `Accepted AI task: ${d.title}`,
          },
          ...state.activity,
        ].slice(0, 100),
        version: state.version + 1,
      }
    }

    case 'DECLINE_DIRECTIVE': {
      const d = state.directives.find((x) => x.id === action.payload.directiveId)
      if (!d || d.status !== 'pending') return state
      return {
        ...state,
        directives: state.directives.map((x) =>
          x.id === d.id ? { ...x, status: 'declined' as const } : x,
        ),
        staff: state.staff.map((s) =>
          s.id === d.staffId && s.currentTaskId === d.id
            ? { ...s, currentTaskId: null }
            : s,
        ),
        aiThoughts: pushThought(
          state.aiThoughts,
          `Declined: ${state.staff.find((s) => s.id === d.staffId)?.name ?? d.staffId} busy — will re-route.`,
        ),
        version: state.version + 1,
      }
    }

    case 'COMPLETE_DIRECTIVE': {
      const d = state.directives.find((x) => x.id === action.payload.directiveId)
      if (!d) return state
      return {
        ...state,
        directives: state.directives.map((x) =>
          x.id === d.id ? { ...x, status: 'completed' as const } : x,
        ),
        staff: state.staff.map((s) =>
          s.id === d.staffId && s.currentTaskId === d.id
            ? { ...s, currentTaskId: null }
            : s,
        ),
        patients: state.patients.map((p) => {
          if (p.id !== d.patientId) return p
          if (d.phase === 'vitals') return { ...p, carePhase: 'awaiting_exam' as const }
          if (d.phase === 'exam') return { ...p, carePhase: 'in_consult' as const }
          return p
        }),
        version: state.version + 1,
      }
    }

    case 'ADMIT_PATIENT': {
      const { id, name, age, reason, vitals, roomId, acuity } = action.payload
      const hasVitals = Boolean(
        vitals.bloodPressure || vitals.heartRate || vitals.temperature,
      )
      const patient = {
        id,
        name,
        age,
        reason,
        vitals: { ...vitals },
        roomId,
        history: [
          {
            id: uid('h'),
            at: stamp(),
            staffId: 'admin-1',
            staffName: 'Clinic Admin',
            summary: `Admitted for: ${reason}`,
          },
        ],
        notes: '',
        visitComplete: false,
        admittedAt: stamp(),
        carePhase: (hasVitals ? 'awaiting_exam' : 'awaiting_vitals') as CarePhase,
        acuity: acuity ?? 'routine',
      }
      const nextPatients = [
        ...state.patients
          .filter((p) => p.id !== id)
          .map((p) =>
            p.roomId === roomId && !p.visitComplete
              ? { ...p, visitComplete: true, roomId: null, carePhase: 'complete' as const }
              : p,
          ),
        patient,
      ]
      const roomName = state.rooms.find((r) => r.id === roomId)?.name ?? roomId
      return {
        ...state,
        patients: nextPatients,
        rooms: roomStatusFromPatients(state.rooms, nextPatients),
        activity: [
          {
            id: uid('act'),
            at: stamp(),
            staffId: 'admin-1',
            patientId: id,
            patientName: name,
            action: `Admitted to ${roomName}`,
          },
          ...state.activity,
        ].slice(0, 100),
        aiThoughts: pushThought(
          state.aiThoughts,
          `New admit: ${name} in ${roomName} (${patient.acuity}) — Demo Agent observing (no auto-move).`,
        ),
        version: state.version + 1,
      }
    }

    case 'UPDATE_PATIENT': {
      const { patientId, vitals, notes, visitComplete, staffId, staffName, carePhase, acuity } =
        action.payload
      const patients = state.patients.map((p) => {
        if (p.id !== patientId) return p
        const summary = visitComplete
          ? 'Visit completed.'
          : 'Updated vitals / clinical notes.'
        let nextPhase: CarePhase = carePhase ?? p.carePhase
        if (visitComplete) nextPhase = 'complete'
        return {
          ...p,
          vitals: { ...vitals },
          notes,
          visitComplete,
          roomId: visitComplete ? null : p.roomId,
          carePhase: nextPhase,
          acuity: acuity ?? p.acuity,
          history: [
            {
              id: uid('h'),
              at: stamp(),
              staffId,
              staffName,
              summary,
            },
            ...p.history,
          ],
        }
      })
      const patient = state.patients.find((p) => p.id === patientId)
      return {
        ...state,
        patients,
        rooms: roomStatusFromPatients(state.rooms, patients),
        activity: patient
          ? [
              {
                id: uid('act'),
                at: stamp(),
                staffId,
                patientId,
                patientName: patient.name,
                action: visitComplete ? 'Completed visit' : 'Updated patient data',
              },
              ...state.activity,
            ].slice(0, 100)
          : state.activity,
        version: state.version + 1,
      }
    }

    case 'SET_PATIENT_ACUITY': {
      const { patientId, acuity, staffId, staffName } = action.payload
      const patient = state.patients.find((p) => p.id === patientId)
      if (!patient) return state
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === patientId ? { ...p, acuity } : p,
        ),
        aiThoughts: pushThought(
          state.aiThoughts,
          `${staffName} set ${patient.name} acuity → ${acuity}.`,
        ),
        activity: [
          {
            id: uid('act'),
            at: stamp(),
            staffId,
            patientId,
            patientName: patient.name,
            action: `Acuity set to ${acuity}`,
          },
          ...state.activity,
        ].slice(0, 100),
        version: state.version + 1,
      }
    }

    case 'DOCTOR_MARK_CRITICAL_MOVE': {
      const { patientId, roomId, staffId, doctorId, doctorName, note } = action.payload
      const patient = state.patients.find((p) => p.id === patientId)
      const staff = state.staff.find((s) => s.id === staffId)
      const room = state.rooms.find((r) => r.id === roomId)
      if (!patient || !staff || !room) return state

      let next = clinicReducer(state, {
        type: 'SET_PATIENT_ACUITY',
        payload: {
          patientId,
          acuity: 'critical',
          staffId: doctorId,
          staffName: doctorName,
        },
      })
      next = clinicReducer(next, {
        type: 'ISSUE_DIRECTIVE',
        payload: {
          staffId,
          roomId,
          patientId,
          priority: 'high',
          title: `MUST MOVE to ${room.name}`,
          reason:
            note?.trim() ||
            `Doctor ${doctorName}: critical — ${patient.name} requires ${staff.name} in ${room.name} now.`,
          phase: staff.role === 'nurse' ? 'vitals' : 'exam',
          must: true,
        },
      })
      next = {
        ...next,
        aiThoughts: pushThought(
          next.aiThoughts,
          `Doctor override: critical must-move — ${staff.name} → ${room.name} (${patient.name}).`,
        ),
        activity: [
          {
            id: uid('act'),
            at: stamp(),
            staffId: doctorId,
            patientId,
            patientName: patient.name,
            action: `Critical must-move issued for ${staff.name}`,
          },
          ...next.activity,
        ].slice(0, 100),
      }
      return next
    }

    case 'DOCTOR_REPORT_ROOM_MISTAKE': {
      const {
        patientId,
        currentRoomId,
        suggestedRoomId,
        doctorId,
        doctorName,
        note,
      } = action.payload
      const patient = state.patients.find((p) => p.id === patientId)
      const current = state.rooms.find((r) => r.id === currentRoomId)
      const suggested = state.rooms.find((r) => r.id === suggestedRoomId)
      if (!patient || !current || !suggested) return state
      const detail =
        note?.trim() ||
        `Critical patient ${patient.name} appears misplaced in ${current.name}; suggest ${suggested.name}.`
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === patientId && p.acuity === 'routine'
            ? { ...p, acuity: 'critical' as const }
            : p,
        ),
        aiThoughts: pushThought(
          state.aiThoughts,
          `Doctor feedback (${doctorName}): ${detail} — Demo Agent logged (no auto-relocate).`,
        ),
        activity: [
          {
            id: uid('act'),
            at: stamp(),
            staffId: doctorId,
            patientId,
            patientName: patient.name,
            action: `Reported wrong room: ${current.name} → suggest ${suggested.name}`,
          },
          ...state.activity,
        ].slice(0, 100),
        version: state.version + 1,
      }
    }

    case 'AI_ASSIST_UPDATE': {
      const {
        patientId,
        vitals,
        notes,
        visitComplete,
        roomStatus,
        staffId,
        staffName,
      } = action.payload
      let next = clinicReducer(state, {
        type: 'UPDATE_PATIENT',
        payload: {
          patientId,
          vitals,
          notes,
          visitComplete,
          staffId,
          staffName,
          carePhase: visitComplete ? 'complete' : 'in_consult',
        },
      })
      const patient = state.patients.find((p) => p.id === patientId)
      if (roomStatus && patient?.roomId) {
        next = {
          ...next,
          rooms: next.rooms.map((r) =>
            r.id === patient.roomId ? { ...r, status: roomStatus } : r,
          ),
          version: next.version + 1,
        }
      }
      // Complete any accepted exam directives for this patient
      next = {
        ...next,
        directives: next.directives.map((d) =>
          d.patientId === patientId &&
          (d.status === 'accepted' || d.status === 'pending') &&
          d.phase === 'exam'
            ? { ...d, status: 'completed' as const }
            : d,
        ),
        staff: next.staff.map((s) => {
          const d = next.directives.find(
            (x) =>
              x.patientId === patientId &&
              x.staffId === s.id &&
              x.phase === 'exam',
          )
          if (d && s.currentTaskId === d.id) return { ...s, currentTaskId: null }
          return s
        }),
        aiThoughts: pushThought(
          next.aiThoughts,
          `AI Copilot applied clinical update for ${patient?.name ?? patientId}${
            roomStatus ? ` · room → ${roomStatus}` : ''
          }`,
        ),
      }
      return next
    }

    default:
      return state
  }
}
