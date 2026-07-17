import type {
  AiDirective,
  AiThought,
  ClinicState,
  Patient,
  Room,
  StaffMember,
} from '../state/types'

const emptyVitals = {
  height: '',
  weight: '',
  bloodPressure: '',
  heartRate: '',
  temperature: '',
}

export const ROOMS: Room[] = [
  // Wing A — corridor y=0
  { id: 'room-1', name: 'Room 1', status: 'occupied', x: 0, y: 0 },
  { id: 'room-2', name: 'Room 2', status: 'occupied', x: 12, y: 0 },
  { id: 'room-3', name: 'Room 3', status: 'available', x: 24, y: 0 },
  { id: 'room-4', name: 'Room 4', status: 'occupied', x: 36, y: 0 },
  // Wing B — y=16
  { id: 'room-5', name: 'Room 5', status: 'available', x: 0, y: 16 },
  { id: 'room-6', name: 'Room 6', status: 'cleaning', x: 12, y: 16 },
  { id: 'room-7', name: 'Room 7', status: 'available', x: 24, y: 16 },
  { id: 'room-8', name: 'Room 8', status: 'occupied', x: 36, y: 16 },
  // Wing C — y=32
  { id: 'room-9', name: 'Room 9', status: 'available', x: 0, y: 32 },
  { id: 'room-10', name: 'Room 10', status: 'available', x: 12, y: 32 },
  { id: 'room-11', name: 'Exam A', status: 'available', x: 24, y: 32 },
  { id: 'room-12', name: 'Exam B', status: 'available', x: 36, y: 32 },
]

function staff(
  partial: Omit<StaffMember, 'currentTaskId'> & { currentTaskId?: string | null },
): StaffMember {
  return { currentTaskId: null, ...partial }
}

export const STAFF: StaffMember[] = [
  staff({
    id: 'admin-1',
    name: 'Clinic Admin',
    role: 'admin',
    specialty: 'Operations',
    contact: 'admin@clinic.demo',
    currentRoomId: null,
    schedule: [
      { time: '08:00', label: 'Intake desk' },
      { time: '12:00', label: 'Census review' },
      { time: '16:00', label: 'Handoff' },
    ],
  }),
  staff({
    id: 'dr-chen',
    name: 'Dr. Chen',
    role: 'doctor',
    specialty: 'Internal Medicine',
    contact: 'chen@clinic.demo',
    currentRoomId: 'room-1',
    schedule: [
      { time: '09:00', label: 'Rounds — Wing A' },
      { time: '11:00', label: 'Consult Room 1' },
      { time: '14:00', label: 'Follow-ups' },
    ],
  }),
  staff({
    id: 'dr-patel',
    name: 'Dr. Patel',
    role: 'doctor',
    specialty: 'Cardiology',
    contact: 'patel@clinic.demo',
    currentRoomId: 'room-2',
    schedule: [
      { time: '08:30', label: 'ECG clinic' },
      { time: '10:30', label: 'Room 2 consult' },
      { time: '15:00', label: 'Charting' },
    ],
  }),
  staff({
    id: 'dr-reyes',
    name: 'Dr. Reyes',
    role: 'doctor',
    specialty: 'Emergency Medicine',
    contact: 'reyes@clinic.demo',
    currentRoomId: null,
    schedule: [
      { time: '07:00', label: 'Shift start' },
      { time: '12:00', label: 'Trauma bay' },
      { time: '18:00', label: 'Sign-out' },
    ],
  }),
  staff({
    id: 'dr-kim',
    name: 'Dr. Kim',
    role: 'doctor',
    specialty: 'Pediatrics',
    contact: 'kim@clinic.demo',
    currentRoomId: null,
    schedule: [
      { time: '09:30', label: 'Well-child visits' },
      { time: '13:00', label: 'Exam A' },
      { time: '16:30', label: 'Parent calls' },
    ],
  }),
  staff({
    id: 'rn-adams',
    name: 'Nurse Adams',
    role: 'nurse',
    specialty: 'Triage',
    contact: 'adams@clinic.demo',
    currentRoomId: 'room-1',
    schedule: [
      { time: '07:30', label: 'Vitals station' },
      { time: '10:00', label: 'Room 1 assist' },
      { time: '14:00', label: 'Med pass' },
    ],
  }),
  staff({
    id: 'rn-brooks',
    name: 'Nurse Brooks',
    role: 'nurse',
    specialty: 'Med-Surg',
    contact: 'brooks@clinic.demo',
    currentRoomId: 'room-4',
    currentTaskId: null,
    schedule: [
      { time: '08:00', label: 'Floor rounds' },
      { time: '11:00', label: 'Room 4' },
      { time: '15:00', label: 'Discharge prep' },
    ],
  }),
  staff({
    id: 'rn-diaz',
    name: 'Nurse Diaz',
    role: 'nurse',
    specialty: 'ICU float',
    contact: 'diaz@clinic.demo',
    currentRoomId: 'room-2',
    schedule: [
      { time: '07:00', label: 'Handoff' },
      { time: '12:00', label: 'Room 2' },
      { time: '17:00', label: 'Charting' },
    ],
  }),
  staff({
    id: 'rn-ellis',
    name: 'Nurse Ellis',
    role: 'nurse',
    specialty: 'Ambulatory',
    contact: 'ellis@clinic.demo',
    currentRoomId: null,
    schedule: [
      { time: '09:00', label: 'Clinic desk' },
      { time: '13:00', label: 'Vaccine clinic' },
      { time: '16:00', label: 'Supply check' },
    ],
  }),
  staff({
    id: 'rn-ford',
    name: 'Nurse Ford',
    role: 'nurse',
    specialty: 'Wound care',
    contact: 'ford@clinic.demo',
    currentRoomId: null,
    schedule: [
      { time: '08:30', label: 'Dressing clinic' },
      { time: '11:30', label: 'Room float' },
      { time: '15:30', label: 'Education' },
    ],
  }),
]

const now = () => new Date().toISOString()

export const PATIENTS: Patient[] = [
  {
    id: 'P-2001',
    name: 'Jordan Lee',
    age: 42,
    reason: 'Chest discomfort',
    vitals: {
      height: '175 cm',
      weight: '82 kg',
      bloodPressure: '138/88',
      heartRate: '92',
      temperature: '37.1°C',
    },
    roomId: 'room-1',
    history: [
      {
        id: 'h1',
        at: now(),
        staffId: 'rn-adams',
        staffName: 'Nurse Adams',
        summary: 'Initial vitals recorded at intake.',
      },
    ],
    notes: 'Patient reports intermittent pressure since morning.',
    visitComplete: false,
    admittedAt: now(),
    carePhase: 'in_consult',
    acuity: 'urgent',
  },
  {
    id: 'P-2002',
    name: 'Sam Rivera',
    age: 67,
    reason: 'Follow-up hypertension',
    vitals: {
      height: '168 cm',
      weight: '74 kg',
      bloodPressure: '148/90',
      heartRate: '78',
      temperature: '36.6°C',
    },
    roomId: 'room-2',
    history: [
      {
        id: 'h2',
        at: now(),
        staffId: 'dr-patel',
        staffName: 'Dr. Patel',
        summary: 'Reviewed home BP log.',
      },
    ],
    notes: 'On amlodipine; reviewing adherence.',
    visitComplete: false,
    admittedAt: now(),
    carePhase: 'in_consult',
    acuity: 'routine',
  },
  {
    id: 'P-2003',
    name: 'Avery Kim',
    age: 29,
    reason: 'Laceration recheck',
    vitals: {
      ...emptyVitals,
      height: '162 cm',
      weight: '61 kg',
      bloodPressure: '118/72',
      heartRate: '70',
      temperature: '36.8°C',
    },
    roomId: 'room-4',
    history: [],
    notes: 'Suture check day 5.',
    visitComplete: false,
    admittedAt: now(),
    carePhase: 'awaiting_vitals',
    acuity: 'routine',
  },
  {
    id: 'P-2004',
    name: 'Casey Morgan',
    age: 55,
    reason: 'Severe chest pain — unstable',
    vitals: {
      height: '178 cm',
      weight: '90 kg',
      bloodPressure: '92/60',
      heartRate: '118',
      temperature: '36.9°C',
    },
    roomId: 'room-8',
    history: [
      {
        id: 'h4',
        at: now(),
        staffId: 'admin-1',
        staffName: 'Clinic Admin',
        summary: 'Admitted as critical; placed in Room 8 pending clinician review.',
      },
    ],
    notes: 'Hypotensive, tachycardic. May be wrong room for acuity.',
    visitComplete: false,
    admittedAt: now(),
    carePhase: 'awaiting_exam',
    acuity: 'critical',
  },
]

const SEED_DIRECTIVES: AiDirective[] = []

const SEED_THOUGHTS: AiThought[] = [
  {
    id: 'thought-1',
    at: now(),
    message: 'Demo Agent online — monitoring rooms. No auto-move for routine cases.',
  },
  {
    id: 'thought-2',
    at: now(),
    message:
      '[P-2004] CRITICAL Casey Morgan in Room 8 — awaiting doctor must-move override if staff needed.',
  },
  {
    id: 'thought-3',
    at: now(),
    message:
      'Doctor feedback sample: critical patients should not sit in low-acuity rooms — use Help the agent on Live Room View.',
  },
]

export function createSeedState(): ClinicState {
  return {
    rooms: ROOMS.map((r) => ({ ...r })),
    patients: PATIENTS.map((p) => ({
      ...p,
      vitals: { ...p.vitals },
      history: [...p.history],
    })),
    staff: STAFF.map((s) => ({
      ...s,
      schedule: [...s.schedule],
    })),
    viewingAs: 'general',
    activity: [
      {
        id: 'act-1',
        at: now(),
        staffId: 'rn-adams',
        patientId: 'P-2001',
        patientName: 'Jordan Lee',
        action: 'Recorded intake vitals',
      },
      {
        id: 'act-2',
        at: now(),
        staffId: 'dr-patel',
        patientId: 'P-2002',
        patientName: 'Sam Rivera',
        action: 'Reviewed BP history',
      },
    ],
    directives: SEED_DIRECTIVES.map((d) => ({ ...d })),
    aiThoughts: SEED_THOUGHTS.map((t) => ({ ...t })),
    version: 1,
  }
}
