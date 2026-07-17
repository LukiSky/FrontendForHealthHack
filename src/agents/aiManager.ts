import type { ClinicAction, ClinicState } from '../state/types'

function roomName(state: ClinicState, roomId: string): string {
  return state.rooms.find((r) => r.id === roomId)?.name ?? roomId
}

function recentlyThought(state: ClinicState, needle: string): boolean {
  return state.aiThoughts.slice(0, 8).some((t) => t.message.includes(needle))
}

/**
 * Demo Agent tick: awareness thoughts only — no routine Move directives.
 * Critical must-moves are created by doctors (DOCTOR_MARK_CRITICAL_MOVE), not here.
 * Completes accepted must directives when staff have arrived in-room.
 */
export function planAiTick(state: ClinicState): ClinicAction[] {
  const actions: ClinicAction[] = []

  // Complete accepted must-moves once staff is in the target room
  for (const d of state.directives) {
    if (!d.must || d.status !== 'accepted') continue
    const staff = state.staff.find((s) => s.id === d.staffId)
    if (staff?.currentRoomId === d.roomId) {
      actions.push({ type: 'COMPLETE_DIRECTIVE', payload: { directiveId: d.id } })
      actions.push({
        type: 'AI_THINK',
        payload: {
          message: `Critical must-move complete: ${staff.name} arrived in ${roomName(state, d.roomId)}.`,
        },
      })
    }
  }

  // Routine awareness — thoughts only, never ISSUE_DIRECTIVE
  const active = state.patients.filter(
    (p) => !p.visitComplete && p.roomId && p.carePhase !== 'complete',
  )

  for (const patient of active) {
    const rName = roomName(state, patient.roomId!)
    const needle = `[${patient.id}]`
    if (recentlyThought(state, needle)) continue

    if (patient.carePhase === 'awaiting_vitals') {
      actions.push({
        type: 'AI_THINK',
        payload: {
          message: `${needle} ${rName}: ${patient.name} awaiting vitals (${patient.acuity}) — no auto-move; clinician decision required.`,
        },
      })
    } else if (patient.carePhase === 'awaiting_exam') {
      actions.push({
        type: 'AI_THINK',
        payload: {
          message: `${needle} ${rName}: ${patient.name} ready for exam (${patient.acuity}) — Demo Agent observing only.`,
        },
      })
    } else if (patient.acuity === 'critical') {
      const hasMust = state.directives.some(
        (d) =>
          d.patientId === patient.id &&
          d.must &&
          (d.status === 'pending' || d.status === 'accepted'),
      )
      if (!hasMust) {
        actions.push({
          type: 'AI_THINK',
          payload: {
            message: `${needle} CRITICAL ${patient.name} in ${rName} — awaiting doctor must-move override if staff needed.`,
          },
        })
      }
    }
  }

  // Pending doctor must-moves — remind feed
  for (const d of state.directives) {
    if (!d.must || d.status !== 'pending') continue
    const staff = state.staff.find((s) => s.id === d.staffId)
    const needle = `must-pending:${d.id}`
    if (recentlyThought(state, needle)) continue
    actions.push({
      type: 'AI_THINK',
      payload: {
        message: `${needle} Waiting on ${staff?.name ?? d.staffId} to Accept critical must-move → ${roomName(state, d.roomId)}.`,
      },
    })
  }

  return actions.slice(0, 4)
}
