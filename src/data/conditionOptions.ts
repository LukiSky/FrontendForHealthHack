import type { Acuity, CarePhase } from '../state/types'

export const LEAVE_CONDITION_OPTIONS = [
  'Stable / as expected',
  'Condition not in that state',
  'Worsening',
  'Needs nurse follow-up',
  'Ready for discharge',
  'Wrong room for acuity',
] as const

export const MUST_MOVE_REASON_OPTIONS = [
  'Unstable vitals',
  'Needs nurse now',
  'Needs doctor exam',
  'Condition not in that state',
  'Room acuity mismatch',
] as const

export const WRONG_ROOM_REASON_OPTIONS = [
  'Critical in low-acuity room',
  'Condition not in that state',
  'Wrong specialty / room type',
  'Should be closer / different wing',
] as const

/** Demo Agent got the patient condition wrong */
export const AGENT_CONDITION_MISTAKE_OPTIONS = [
  'Condition not in that state',
  'Acuity is too low',
  'Acuity is too high',
  'Care phase is wrong',
  'Vitals do not match chart',
  'Wrong room for this condition',
] as const

export const ACUITY_OPTIONS: { value: Acuity; label: string }[] = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
]

export const CARE_PHASE_OPTIONS: { value: CarePhase; label: string }[] = [
  { value: 'awaiting_vitals', label: 'Awaiting vitals' },
  { value: 'awaiting_exam', label: 'Awaiting exam' },
  { value: 'in_consult', label: 'In consult' },
  { value: 'complete', label: 'Complete' },
]

export type LeaveCondition = (typeof LEAVE_CONDITION_OPTIONS)[number]
export type MustMoveReason = (typeof MUST_MOVE_REASON_OPTIONS)[number]
export type WrongRoomReason = (typeof WRONG_ROOM_REASON_OPTIONS)[number]
export type AgentConditionMistake = (typeof AGENT_CONDITION_MISTAKE_OPTIONS)[number]
