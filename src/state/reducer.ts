import type {
  AiDirective,
  AiThought,
  CarePhase,
  ClinicAction,
  ClinicState,
  RoomStatus,
  SimulationStage,
} from './types'
import { createSeedState } from '../data/seed'

export function roomStatusFromPatients(
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
        rooms: roomStatusFromPatients(action.payload.rooms, action.payload.patients),
        directives: action.payload.directives ?? [],
        aiThoughts: action.payload.aiThoughts ?? [],
        agentAssignEnabled: action.payload.agentAssignEnabled ?? true,
        nextSimulationAt: action.payload.nextSimulationAt ?? Date.now() + 4_000,
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

    case 'SET_AGENT_ASSIGN':
      return {
        ...state,
        agentAssignEnabled: action.payload.enabled,
        aiThoughts: pushThought(
          state.aiThoughts,
          action.payload.enabled
            ? 'Admin resumed Demo Agent room assignment from waiting list.'
            : 'Admin paused Demo Agent room assignment.',
        ),
        version: state.version + 1,
      }

    case 'AGENT_TICK':
      return {
        ...state,
        lastAgentTickAt: action.payload.at ?? stamp(),
        version: state.version + 1,
      }

    case 'RESET_DEMO': {
      const seeded = createSeedState()
      return {
        ...seeded,
        viewingAs: state.viewingAs,
        aiThoughts: [
          {
            id: uid('thought'),
            at: stamp(),
            message:
              'Demo reset — waiting queue is ready. Watch the agent choose a room, or assign next now.',
          },
          ...seeded.aiThoughts,
        ].slice(0, 50),
        activity: [
          {
            id: uid('act'),
            at: stamp(),
            staffId: 'admin-1',
            patientId: '',
            patientName: 'Clinic Admin',
            action: 'Reset simulation demo',
          },
          ...seeded.activity,
        ].slice(0, 100),
        version: state.version + 1,
      }
    }

    case 'SET_STAFF_LOCATION': {
      const { staffId, roomId } = action.payload
      const staff = state.staff.find((s) => s.id === staffId)
      const roomName = roomId
        ? (state.rooms.find((r) => r.id === roomId)?.name ?? roomId)
        : null
      const actionText = roomName
        ? `Moved to ${roomName}`
        : 'Left room (station)'
      return {
        ...state,
        staff: state.staff.map((s) =>
          s.id === staffId ? { ...s, currentRoomId: roomId } : s,
        ),
        activity: staff
          ? [
              {
                id: uid('act'),
                at: stamp(),
                staffId,
                patientId: '',
                patientName: staff.name,
                action: actionText,
              },
              ...state.activity,
            ].slice(0, 100)
          : state.activity,
        version: state.version + 1,
      }
    }

    case 'SIMULATION_TRANSITION': {
      const { patientId, expectedStage, nextStage, carePhase, statusNote, vitals } =
        action.payload
      const patient = state.patients.find((p) => p.id === patientId)
      if (
        !patient ||
        patient.visitComplete ||
        !patient.roomId ||
        patient.lifecyclePaused ||
        patient.simulationStage !== expectedStage ||
        state.directives.some(
          (directive) =>
            directive.patientId === patientId &&
            directive.must &&
            (directive.status === 'pending' || directive.status === 'accepted'),
        )
      ) {
        return state
      }

      const at = stamp()
      const patients = state.patients.map((p) =>
        p.id === patientId
          ? {
              ...p,
              carePhase,
              statusNote,
              statusUpdatedAt: at,
              simulationStage: nextStage,
              lifecycleUpdatedAt: at,
              vitals: { ...p.vitals, ...vitals },
              history: [
                {
                  id: uid('h'),
                  at,
                  staffId: 'ai-agent',
                  staffName: 'Demo Agent',
                  summary: statusNote,
                },
                ...p.history,
              ],
            }
          : p,
      )

      return {
        ...state,
        patients,
        activity: [
          {
            id: uid('act'),
            at,
            staffId: 'ai-agent',
            patientId,
            patientName: patient.name,
            action: `Lifecycle: ${statusNote}`,
          },
          ...state.activity,
        ].slice(0, 100),
        aiThoughts: pushThought(
          state.aiThoughts,
          `${patient.name} in ${
            state.rooms.find((room) => room.id === patient.roomId)?.name ?? patient.roomId
          }: ${statusNote}`,
        ),
        version: state.version + 1,
        nextSimulationAt: Date.now() + 7_000,
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
            patientName: state.staff.find((s) => s.id === d.staffId)?.name ?? '',
            action: `Moved to ${room?.name ?? d.roomId}`,
          },
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
      const staffName = state.staff.find((s) => s.id === d.staffId)?.name ?? d.staffId
      const patientName = state.patients.find((p) => p.id === d.patientId)?.name ?? ''
      const roomName = state.rooms.find((r) => r.id === d.roomId)?.name ?? d.roomId
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
        activity: [
          {
            id: uid('act'),
            at: stamp(),
            staffId: d.staffId,
            patientId: d.patientId,
            patientName,
            action: `Must-move complete: ${staffName} arrived in ${roomName}`,
          },
          ...state.activity,
        ].slice(0, 100),
        aiThoughts: pushThought(
          state.aiThoughts,
          `Must-move complete: ${staffName} arrived in ${roomName} for ${patientName}.`,
        ),
        version: state.version + 1,
      }
    }

    case 'ADMIT_PATIENT': {
      const {
        id,
        name,
        preferredName = '',
        age,
        dateOfBirth = '',
        sex = '',
        phone = '',
        email = '',
        address = '',
        emergencyName = '',
        emergencyPhone = '',
        emergencyRelation = '',
        preferredLanguage = 'English',
        insuranceProvider = '',
        insuranceId = '',
        referringSource = '',
        arrivalMode = '',
        reason,
        symptomOnset = '',
        symptomDuration = '',
        painScore = '',
        allergies = '',
        medications = '',
        pastMedicalHistory = '',
        vitals,
        notes = '',
        roomId,
        acuity,
        chartIncomplete = false,
      } = action.payload
      const hasVitals = Boolean(
        vitals.bloodPressure ||
          vitals.heartRate ||
          vitals.temperature ||
          vitals.respiratoryRate ||
          vitals.spo2,
      )
      const detailBits = [
        allergies.trim() && `Allergies: ${allergies.trim()}`,
        medications.trim() && `Meds: ${medications.trim()}`,
        painScore.trim() && `Pain ${painScore.trim()}/10`,
        arrivalMode && `Arrival: ${arrivalMode}`,
        chartIncomplete && 'Chart incomplete — finish intake later',
      ].filter(Boolean)
      const patient = {
        id,
        name,
        preferredName,
        age,
        dateOfBirth,
        sex,
        phone,
        email,
        address,
        emergencyName,
        emergencyPhone,
        emergencyRelation,
        preferredLanguage,
        insuranceProvider,
        insuranceId,
        referringSource,
        arrivalMode,
        reason,
        symptomOnset,
        symptomDuration,
        painScore,
        allergies,
        medications,
        pastMedicalHistory,
        vitals: { ...vitals },
        roomId,
        history: [
          {
            id: uid('h'),
            at: stamp(),
            staffId: 'admin-1',
            staffName: 'Clinic Admin',
            summary: [
              chartIncomplete
                ? `Quick urgent admit: ${reason}`
                : roomId
                  ? `Admitted for: ${reason}`
                  : `Added to waiting list: ${reason}`,
              ...detailBits,
            ].join(' · '),
          },
        ],
        notes,
        visitComplete: false,
        chartIncomplete,
        admittedAt: stamp(),
        carePhase: (hasVitals ? 'awaiting_exam' : 'awaiting_vitals') as CarePhase,
        acuity: acuity ?? 'routine',
      }
      const targetOccupied = roomId
        ? state.patients.some((p) => p.roomId === roomId && !p.visitComplete)
        : false
      if (targetOccupied) return state
      const nextPatients = [
        ...state.patients.filter((p) => p.id !== id),
        patient,
      ]
      const roomName = roomId
        ? (state.rooms.find((r) => r.id === roomId)?.name ?? roomId)
        : 'waiting list'
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
            action: chartIncomplete
              ? `Quick urgent admit to ${roomName} (chart incomplete)`
              : roomId
                ? `Admitted to ${roomName}`
                : 'Added to waiting list',
          },
          ...state.activity,
        ].slice(0, 100),
        aiThoughts: pushThought(
          state.aiThoughts,
          chartIncomplete
            ? `Quick urgent: ${name} → ${roomName} (${patient.acuity}) — finish chart later.`
            : roomId
              ? `New admit: ${name} in ${roomName} (${patient.acuity}).`
              : `Waiting list: ${name} (${patient.acuity}) — Demo Agent will assign a room.`,
        ),
        agentAssignmentNotBefore:
          roomId === null ? Date.now() + 4_000 : state.agentAssignmentNotBefore,
        version: state.version + 1,
      }
    }

    case 'COMPLETE_INTAKE': {
      const {
        patientId,
        name,
        preferredName = '',
        age,
        dateOfBirth = '',
        sex = '',
        phone = '',
        email = '',
        address = '',
        emergencyName = '',
        emergencyPhone = '',
        emergencyRelation = '',
        preferredLanguage = 'English',
        insuranceProvider = '',
        insuranceId = '',
        referringSource = '',
        arrivalMode = '',
        reason,
        symptomOnset = '',
        symptomDuration = '',
        painScore = '',
        allergies = '',
        medications = '',
        pastMedicalHistory = '',
        vitals,
        notes = '',
        acuity,
      } = action.payload
      const existing = state.patients.find((p) => p.id === patientId && !p.visitComplete)
      if (!existing) return state
      const hasVitals = Boolean(
        vitals.bloodPressure ||
          vitals.heartRate ||
          vitals.temperature ||
          vitals.respiratoryRate ||
          vitals.spo2,
      )
      const nextPatients = state.patients.map((p) => {
        if (p.id !== patientId) return p
        return {
          ...p,
          name,
          preferredName,
          age,
          dateOfBirth,
          sex,
          phone,
          email,
          address,
          emergencyName,
          emergencyPhone,
          emergencyRelation,
          preferredLanguage,
          insuranceProvider,
          insuranceId,
          referringSource,
          arrivalMode,
          reason,
          symptomOnset,
          symptomDuration,
          painScore,
          allergies,
          medications,
          pastMedicalHistory,
          vitals: { ...vitals },
          notes,
          chartIncomplete: false,
          acuity: acuity ?? p.acuity,
          carePhase:
            hasVitals && p.carePhase === 'awaiting_vitals'
              ? ('awaiting_exam' as CarePhase)
              : p.carePhase,
          history: [
            {
              id: uid('h'),
              at: stamp(),
              staffId: 'admin-1',
              staffName: 'Clinic Admin',
              summary: 'Intake chart completed',
            },
            ...p.history,
          ],
        }
      })
      return {
        ...state,
        patients: nextPatients,
        activity: [
          {
            id: uid('act'),
            at: stamp(),
            staffId: 'admin-1',
            patientId,
            patientName: name,
            action: 'Completed intake chart',
          },
          ...state.activity,
        ].slice(0, 100),
        aiThoughts: pushThought(
          state.aiThoughts,
          `Intake complete for ${name} — chart no longer incomplete.`,
        ),
        version: state.version + 1,
      }
    }

    case 'MOVE_PATIENT': {
      const { patientId, roomId, by, note } = action.payload
      const patient = state.patients.find((p) => p.id === patientId && !p.visitComplete)
      const room = state.rooms.find((r) => r.id === roomId)
      if (!patient || !room || room.status === 'cleaning') return state
      const targetOccupied = state.patients.some(
        (p) => p.id !== patientId && p.roomId === roomId && !p.visitComplete,
      )
      if (targetOccupied) return state

      const fromWaiting = !patient.roomId
      const nextPatients = state.patients.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            roomId,
            carePhase: fromWaiting ? 'awaiting_vitals' : p.carePhase,
            statusNote: fromWaiting
              ? `Arrived in ${room.name} — waiting for initial vitals.`
              : `Moved to ${room.name} — care team notified.`,
            statusUpdatedAt: stamp(),
            simulationStage: fromWaiting ? 'roomed' : p.simulationStage,
            lifecycleUpdatedAt: stamp(),
            lifecyclePaused: false,
            history: [
              {
                id: uid('h'),
                at: stamp(),
                staffId: by === 'agent' ? 'ai-agent' : 'admin-1',
                staffName: by === 'agent' ? 'Demo Agent' : 'Clinic Admin',
                summary:
                  note ??
                  (fromWaiting
                    ? `Assigned from waiting list to ${room.name}`
                    : `Moved to ${room.name}`),
              },
              ...p.history,
            ],
          }
        }
        return p
      })

      const who = by === 'agent' ? 'Demo Agent' : 'Admin'
      const actionText = fromWaiting
        ? `${who} assigned to ${room.name} from waiting`
        : `${who} moved to ${room.name}`

      return {
        ...state,
        patients: nextPatients,
        rooms: roomStatusFromPatients(state.rooms, nextPatients),
        activity: [
          {
            id: uid('act'),
            at: stamp(),
            staffId: by === 'agent' ? 'ai-agent' : 'admin-1',
            patientId,
            patientName: patient.name,
            action: actionText,
          },
          ...state.activity,
        ].slice(0, 100),
        aiThoughts: pushThought(
          state.aiThoughts,
          by === 'agent'
            ? `Assigning ${patient.name} → ${room.name} (${patient.acuity}) from waiting list.`
            : `Admin override: ${patient.name} → ${room.name}${note ? ` — ${note}` : ''}.`,
        ),
        version: state.version + 1,
        nextSimulationAt: fromWaiting ? Date.now() + 5_000 : state.nextSimulationAt,
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
        const simulationStage: SimulationStage = visitComplete
          ? 'ready_for_discharge'
          : nextPhase === 'awaiting_vitals'
            ? 'roomed'
            : nextPhase === 'awaiting_exam'
              ? 'awaiting_exam'
              : 'ready_for_discharge'
        return {
          ...p,
          vitals: { ...vitals },
          notes,
          visitComplete,
          roomId: visitComplete ? null : p.roomId,
          carePhase: nextPhase,
          acuity: acuity ?? p.acuity,
          statusNote: visitComplete
            ? 'Visit completed — room released.'
            : `${staffName} updated care — ${nextPhase.replace(/_/g, ' ')}.`,
          statusUpdatedAt: stamp(),
          simulationStage,
          lifecycleUpdatedAt: stamp(),
          lifecyclePaused: !visitComplete,
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
          p.id === patientId
            ? {
                ...p,
                acuity,
                statusNote: `${staffName} changed triage to ${acuity}.`,
                statusUpdatedAt: stamp(),
                lifecyclePaused: true,
                lifecycleUpdatedAt: stamp(),
              }
            : p,
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
