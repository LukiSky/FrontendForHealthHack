export type StaffRole = 'doctor' | 'nurse' | 'admin'
export type RoomStatus = 'available' | 'occupied' | 'cleaning'
export type CarePhase = 'awaiting_vitals' | 'awaiting_exam' | 'in_consult' | 'complete'
export type Acuity = 'routine' | 'urgent' | 'critical'
export type SimulationStage =
  | 'waiting'
  | 'roomed'
  | 'vitals_recorded'
  | 'awaiting_exam'
  | 'ready_for_discharge'
export type DirectiveStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'superseded'
export type DirectivePhase = 'vitals' | 'exam' | 'followup'
export type DirectivePriority = 'high' | 'normal'

export interface Vitals {
  height: string
  weight: string
  bloodPressure: string
  heartRate: string
  temperature: string
  respiratoryRate: string
  spo2: string
}

export type ArrivalMode =
  | ''
  | 'walk-in'
  | 'ambulance'
  | 'referral'
  | 'scheduled'
  | 'transfer'

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
  preferredName: string
  age: number
  dateOfBirth: string
  sex: string
  phone: string
  email: string
  address: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelation: string
  preferredLanguage: string
  insuranceProvider: string
  insuranceId: string
  referringSource: string
  arrivalMode: ArrivalMode
  reason: string
  symptomOnset: string
  symptomDuration: string
  painScore: string
  allergies: string
  medications: string
  pastMedicalHistory: string
  vitals: Vitals
  roomId: string | null
  history: PatientHistoryEntry[]
  notes: string
  visitComplete: boolean
  /** True when admitted via Quick urgent — full chart still needed */
  chartIncomplete: boolean
  admittedAt: string
  carePhase: CarePhase
  acuity: Acuity
  /** Plain-language, live condition update shown on the room board. */
  statusNote?: string
  statusUpdatedAt?: string
  /** Persisted, guarded demo lifecycle. Manual care may pause this progression. */
  simulationStage?: SimulationStage
  lifecycleUpdatedAt?: string
  lifecyclePaused?: boolean
}

/** Defaults for new / migrated patients */
export function emptyVitals(): Vitals {
  return {
    height: '',
    weight: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    spo2: '',
  }
}

export function emptyPatientProfile(): Pick<
  Patient,
  | 'preferredName'
  | 'dateOfBirth'
  | 'sex'
  | 'phone'
  | 'email'
  | 'address'
  | 'emergencyName'
  | 'emergencyPhone'
  | 'emergencyRelation'
  | 'preferredLanguage'
  | 'insuranceProvider'
  | 'insuranceId'
  | 'referringSource'
  | 'arrivalMode'
  | 'symptomOnset'
  | 'symptomDuration'
  | 'painScore'
  | 'allergies'
  | 'medications'
  | 'pastMedicalHistory'
> {
  return {
    preferredName: '',
    dateOfBirth: '',
    sex: '',
    phone: '',
    email: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    preferredLanguage: 'English',
    insuranceProvider: '',
    insuranceId: '',
    referringSource: '',
    arrivalMode: '',
    symptomOnset: '',
    symptomDuration: '',
    painScore: '',
    allergies: '',
    medications: '',
    pastMedicalHistory: '',
  }
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
  if (viewingAs === 'admin') return '/admin/demo'
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
  /** When false, Demo Agent will not auto-assign waiting patients to rooms */
  agentAssignEnabled: boolean
  /** Keeps new/reset waiting patients visible before automatic assignment begins. */
  agentAssignmentNotBefore: number
  /** ISO timestamp of the last Demo Agent tick — drives the live sim clock UI */
  lastAgentTickAt: string
  /** Next patient-only lifecycle transition; persisted for reliable multi-tab playback. */
  nextSimulationAt: number
  version: number
}

export type ClinicAction =
  | {
      type: 'ADMIT_PATIENT'
      payload: {
        id: string
        name: string
        preferredName?: string
        age: number
        dateOfBirth?: string
        sex?: string
        phone?: string
        email?: string
        address?: string
        emergencyName?: string
        emergencyPhone?: string
        emergencyRelation?: string
        preferredLanguage?: string
        insuranceProvider?: string
        insuranceId?: string
        referringSource?: string
        arrivalMode?: ArrivalMode
        reason: string
        symptomOnset?: string
        symptomDuration?: string
        painScore?: string
        allergies?: string
        medications?: string
        pastMedicalHistory?: string
        vitals: Vitals
        notes?: string
        roomId: string | null
        acuity?: Acuity
        chartIncomplete?: boolean
      }
    }
  | {
      type: 'COMPLETE_INTAKE'
      payload: {
        patientId: string
        name: string
        preferredName?: string
        age: number
        dateOfBirth?: string
        sex?: string
        phone?: string
        email?: string
        address?: string
        emergencyName?: string
        emergencyPhone?: string
        emergencyRelation?: string
        preferredLanguage?: string
        insuranceProvider?: string
        insuranceId?: string
        referringSource?: string
        arrivalMode?: ArrivalMode
        reason: string
        symptomOnset?: string
        symptomDuration?: string
        painScore?: string
        allergies?: string
        medications?: string
        pastMedicalHistory?: string
        vitals: Vitals
        notes?: string
        acuity?: Acuity
      }
    }
  | {
      type: 'MOVE_PATIENT'
      payload: {
        patientId: string
        roomId: string
        by: 'agent' | 'admin'
        note?: string
      }
    }
  | { type: 'SET_AGENT_ASSIGN'; payload: { enabled: boolean } }
  | { type: 'AGENT_TICK'; payload: { at?: string } }
  | {
      type: 'SIMULATION_TRANSITION'
      payload: {
        patientId: string
        expectedStage: SimulationStage
        nextStage: SimulationStage
        carePhase: CarePhase
        statusNote: string
        vitals?: Partial<Vitals>
      }
    }
  | { type: 'RESET_DEMO' }
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
