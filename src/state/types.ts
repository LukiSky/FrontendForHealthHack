export type StaffRole = 'doctor' | 'nurse' | 'admin'
export type RoomStatus = 'available' | 'occupied' | 'cleaning'
export type CarePhase = 'awaiting_vitals' | 'awaiting_exam' | 'in_consult' | 'complete'
export type Acuity = 'routine' | 'urgent' | 'critical'
export type DirectiveStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'superseded'
export type DirectivePhase = 'vitals' | 'exam' | 'followup'
export type DirectivePriority = 'high' | 'normal'

export interface Vitals {
  height: string
  weight: string
  bloodPressure: string
  heartRate: string
  temperature: string
}

export interface PatientHistoryEntry {
  id: string
  at: string
  staffId: string
  staffName: string
  summary: string
}

export interface Patient {
  id: string
  name: string
  age: number
  reason: string
  vitals: Vitals
  roomId: string | null
  history: PatientHistoryEntry[]
  notes: string
  visitComplete: boolean
  admittedAt: string
  carePhase: CarePhase
  acuity: Acuity
}

export interface ScheduleSlot {
  time: string
  label: string
}

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
  specialty: string
  contact: string
  currentRoomId: string | null
  schedule: ScheduleSlot[]
  currentTaskId: string | null
}

export interface Room {
  id: string
  name: string
  status: RoomStatus
  /** Floor-plan coordinates (demo units) for distance routing */
  x: number
  y: number
}

export interface ActivityEntry {
  id: string
  at: string
  staffId: string
  patientId: string
  patientName: string
  action: string
}

export interface AiDirective {
  id: string
  staffId: string
  roomId: string
  patientId: string
  priority: DirectivePriority
  title: string
  reason: string
  phase: DirectivePhase
  status: DirectiveStatus
  createdAt: string
  /** Doctor-declared critical must-move — only these force Accept & Move */
  must: boolean
}

export interface AiThought {
  id: string
  at: string
  message: string
}

export type ViewingAs = 'general' | 'admin' | 'ai' | string

export function isStaffViewingAs(viewingAs: ViewingAs): boolean {
  return viewingAs !== 'general' && viewingAs !== 'admin' && viewingAs !== 'ai'
}

export function homePathForView(viewingAs: ViewingAs): string {
  if (viewingAs === 'general') return '/'
  if (viewingAs === 'admin') return '/'
  if (viewingAs === 'ai') return '/rooms'
  return '/my-dashboard'
}

export interface ClinicState {
  rooms: Room[]
  patients: Patient[]
  staff: StaffMember[]
  viewingAs: ViewingAs
  activity: ActivityEntry[]
  directives: AiDirective[]
  aiThoughts: AiThought[]
  version: number
}

export type ClinicAction =
  | {
      type: 'ADMIT_PATIENT'
      payload: {
        id: string
        name: string
        age: number
        reason: string
        vitals: Vitals
        roomId: string
        acuity?: Acuity
      }
    }
  | {
      type: 'UPDATE_PATIENT'
      payload: {
        patientId: string
        vitals: Vitals
        notes: string
        visitComplete: boolean
        staffId: string
        staffName: string
        carePhase?: CarePhase
        acuity?: Acuity
      }
    }
  | {
      type: 'SET_STAFF_LOCATION'
      payload: { staffId: string; roomId: string | null }
    }
  | { type: 'SET_VIEWING_AS'; payload: { viewingAs: ViewingAs } }
  | { type: 'HYDRATE'; payload: ClinicState }
  | { type: 'AI_THINK'; payload: { message: string } }
  | {
      type: 'ISSUE_DIRECTIVE'
      payload: Omit<AiDirective, 'id' | 'createdAt' | 'status'> & {
        id?: string
        status?: DirectiveStatus
        must?: boolean
      }
    }
  | { type: 'ACCEPT_DIRECTIVE'; payload: { directiveId: string } }
  | { type: 'DECLINE_DIRECTIVE'; payload: { directiveId: string } }
  | { type: 'COMPLETE_DIRECTIVE'; payload: { directiveId: string } }
  | {
      type: 'AI_ASSIST_UPDATE'
      payload: {
        patientId: string
        vitals: Vitals
        notes: string
        visitComplete: boolean
        roomStatus?: RoomStatus
        staffId: string
        staffName: string
      }
    }
  | {
      type: 'SET_ROOM_STATUS'
      payload: { roomId: string; status: RoomStatus }
    }
  | {
      type: 'DOCTOR_MARK_CRITICAL_MOVE'
      payload: {
        patientId: string
        roomId: string
        staffId: string
        doctorId: string
        doctorName: string
        note?: string
      }
    }
  | {
      type: 'DOCTOR_REPORT_ROOM_MISTAKE'
      payload: {
        patientId: string
        currentRoomId: string
        suggestedRoomId: string
        doctorId: string
        doctorName: string
        note?: string
      }
    }
  | {
      type: 'SET_PATIENT_ACUITY'
      payload: { patientId: string; acuity: Acuity; staffId: string; staffName: string }
    }
  | { type: 'AI_BATCH'; payload: ClinicAction[] }
