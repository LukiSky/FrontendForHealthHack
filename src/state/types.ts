export type TriageLevel = 1 | 2 | 3
export type StaffRole = 'doctor' | 'nurse'
export type StaffStatus = 'idle' | 'busy'
export type PatientLocation = 'triage' | string | 'discharged'
export type PatientStatus = 'waiting' | 'in_room' | 'treating' | 'discharged'
export type LogSource = 'agent' | 'manual'

export interface Room {
  id: string
  level: TriageLevel
  patientId: string | null
  staffId: string | null
}

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
  status: StaffStatus
  assignedRoomId: string | null
}

export interface Patient {
  id: string
  name: string
  triageLevel: TriageLevel
  location: PatientLocation
  assignedStaffId: string | null
  treatmentProgress: number
  treatmentRequired: number
  crashed: boolean
  status: PatientStatus
}

export interface LogEntry {
  id: string
  timestamp: string
  source: LogSource
  agent?: string
  message: string
}

export interface SimulationState {
  rooms: Room[]
  staffMembers: StaffMember[]
  patients: Patient[]
  logs: LogEntry[]
  tickRateMs: number
  isRunning: boolean
  autoGeneratePatients: boolean
  tickCount: number
  activeStaffId: string
}

export type SimulationAction =
  | { type: 'ADMIT_PATIENT'; payload: { id: string; name: string; triageLevel: TriageLevel } }
  | { type: 'MOVE_PATIENT'; payload: { patientId: string; roomId: string } }
  | { type: 'ESCALATE'; payload: { patientId: string } }
  | { type: 'DEESCALATE'; payload: { patientId: string } }
  | { type: 'ASSIGN_SELF'; payload: { patientId: string } }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'TOGGLE_AUTO_GENERATE' }
  | { type: 'TICK' }
