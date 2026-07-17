import type {
  AiDirective,
  AiThought,
  ClinicState,
  Patient,
  Room,
  StaffMember,
} from '../state/types'
import { emptyPatientProfile, emptyVitals as blankVitals } from '../state/types'

const emptyVitals = blankVitals()

const now = () => new Date().toISOString()

function patient(
  partial: Omit<Partial<Patient>, 'id' | 'name' | 'age' | 'reason'> &
    Pick<Patient, 'id' | 'name' | 'age' | 'reason'>,
): Patient {
  const { vitals: vitalsPartial, ...rest } = partial
  return {
    ...emptyPatientProfile(),
    roomId: null,
    history: [],
    notes: '',
    visitComplete: false,
    chartIncomplete: false,
    admittedAt: now(),
    carePhase: 'awaiting_vitals',
    acuity: 'routine',
    ...rest,
    simulationStage:
      rest.simulationStage ??
      (rest.roomId
        ? rest.carePhase === 'awaiting_vitals'
          ? 'roomed'
          : rest.carePhase === 'awaiting_exam'
            ? 'awaiting_exam'
            : 'ready_for_discharge'
        : 'waiting'),
    lifecycleUpdatedAt: rest.lifecycleUpdatedAt ?? now(),
    lifecyclePaused: rest.lifecyclePaused ?? false,
    vitals: { ...emptyVitals, ...vitalsPartial },
  }
}

export const ROOMS: Room[] = (() => {
  const rooms: Room[] = []
  const cols = 6
  const rows = 5
  const special: Record<number, string> = {
    29: 'Trauma',
    30: 'Exam A',
  }
  const occupied = new Set([1, 2, 4, 8])
  const cleaning = new Set([6])
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const n = row * cols + col + 1
      const id = `room-${n}`
      const name = special[n] ?? `Room ${n}`
      const status = cleaning.has(n)
        ? ('cleaning' as const)
        : occupied.has(n)
          ? ('occupied' as const)
          : ('available' as const)
      rooms.push({
        id,
        name,
        status,
        x: col * 14,
        y: row * 14,
      })
    }
  }
  return rooms
})()

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
    currentRoomId: null,
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
    currentRoomId: null,
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
    currentRoomId: null,
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
    currentRoomId: null,
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
    currentRoomId: null,
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

export const PATIENTS: Patient[] = [
  patient({
    id: 'P-2001',
    name: 'Jordan Lee',
    preferredName: 'Jordan',
    age: 42,
    dateOfBirth: '1984-03-12',
    sex: 'female',
    phone: '555-0142',
    email: 'jordan.lee@email.demo',
    address: '14 Maple St',
    emergencyName: 'Chris Lee',
    emergencyPhone: '555-0143',
    emergencyRelation: 'Spouse',
    insuranceProvider: 'ClinicCare Mutual',
    insuranceId: 'CCM-88421',
    arrivalMode: 'walk-in',
    reason: 'Chest discomfort',
    symptomOnset: 'This morning ~08:00',
    symptomDuration: '6 hours',
    painScore: '5',
    allergies: 'Penicillin (rash)',
    medications: 'None regular',
    pastMedicalHistory: 'GERD; no prior cardiac disease',
    vitals: {
      height: '175 cm',
      weight: '82 kg',
      bloodPressure: '138/88',
      heartRate: '92',
      temperature: '37.1°C',
      respiratoryRate: '18',
      spo2: '97',
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
    notes: 'Patient reports intermittent pressure since morning. Denies radiation to arm.',
    carePhase: 'in_consult',
    acuity: 'urgent',
  }),
  patient({
    id: 'P-2002',
    name: 'Sam Rivera',
    age: 67,
    dateOfBirth: '1959-11-02',
    sex: 'male',
    phone: '555-0201',
    email: 'sam.rivera@email.demo',
    address: '88 Oak Ave',
    emergencyName: 'Maria Rivera',
    emergencyPhone: '555-0202',
    emergencyRelation: 'Daughter',
    insuranceProvider: 'Medicare Demo',
    insuranceId: 'MD-44102',
    referringSource: 'Primary care — Dr. Walsh',
    arrivalMode: 'scheduled',
    reason: 'Follow-up hypertension',
    symptomOnset: 'Chronic',
    symptomDuration: 'Ongoing',
    painScore: '0',
    allergies: 'NKDA',
    medications: 'Amlodipine 5 mg daily',
    pastMedicalHistory: 'Hypertension, hyperlipidemia',
    vitals: {
      height: '168 cm',
      weight: '74 kg',
      bloodPressure: '148/90',
      heartRate: '78',
      temperature: '36.6°C',
      respiratoryRate: '16',
      spo2: '98',
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
    carePhase: 'in_consult',
    acuity: 'routine',
  }),
  patient({
    id: 'P-2003',
    name: 'Avery Kim',
    age: 29,
    dateOfBirth: '1997-06-18',
    sex: 'female',
    phone: '555-0330',
    arrivalMode: 'walk-in',
    reason: 'Laceration recheck',
    symptomOnset: '5 days ago',
    symptomDuration: '5 days',
    painScore: '2',
    allergies: 'Latex (contact)',
    medications: 'Ibuprofen PRN',
    pastMedicalHistory: 'None significant',
    vitals: {
      height: '162 cm',
      weight: '61 kg',
      bloodPressure: '118/72',
      heartRate: '70',
      temperature: '36.8°C',
      respiratoryRate: '14',
      spo2: '99',
    },
    roomId: 'room-4',
    notes: 'Suture check day 5. Wound clean, no erythema.',
    carePhase: 'awaiting_vitals',
    acuity: 'routine',
  }),
  patient({
    id: 'P-2004',
    name: 'Casey Morgan',
    age: 55,
    dateOfBirth: '1971-01-29',
    sex: 'male',
    phone: '555-0488',
    emergencyName: 'Pat Morgan',
    emergencyPhone: '555-0489',
    emergencyRelation: 'Partner',
    arrivalMode: 'ambulance',
    referringSource: 'EMS',
    reason: 'Severe chest pain — unstable',
    symptomOnset: '45 minutes ago',
    symptomDuration: '45 min',
    painScore: '9',
    allergies: 'Aspirin (GI bleed history — verify)',
    medications: 'Metformin, atorvastatin',
    pastMedicalHistory: 'Type 2 DM, smoker',
    vitals: {
      height: '178 cm',
      weight: '90 kg',
      bloodPressure: '92/60',
      heartRate: '118',
      temperature: '36.9°C',
      respiratoryRate: '24',
      spo2: '91',
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
    carePhase: 'awaiting_exam',
    acuity: 'critical',
  }),
  patient({
    id: 'P-2005',
    name: 'Riley Chen',
    age: 41,
    sex: 'female',
    phone: '555-0511',
    arrivalMode: 'walk-in',
    reason: 'Abdominal pain — waiting for room',
    symptomOnset: 'Yesterday evening',
    symptomDuration: '~18 hours',
    painScore: '7',
    allergies: 'NKDA',
    medications: 'Oral contraceptive',
    pastMedicalHistory: 'Appendectomy 2012',
    history: [
      {
        id: 'h5',
        at: now(),
        staffId: 'admin-1',
        staffName: 'Clinic Admin',
        summary: 'Added to waiting list.',
      },
    ],
    acuity: 'urgent',
  }),
  patient({
    id: 'P-2006',
    name: 'Morgan Blake',
    age: 33,
    sex: 'male',
    phone: '555-0612',
    arrivalMode: 'walk-in',
    reason: 'Fever and cough',
    symptomOnset: '3 days ago',
    symptomDuration: '3 days',
    painScore: '1',
    allergies: 'NKDA',
    medications: 'None',
    pastMedicalHistory: 'Seasonal asthma',
    history: [
      {
        id: 'h6',
        at: now(),
        staffId: 'admin-1',
        staffName: 'Clinic Admin',
        summary: 'Added to waiting list.',
      },
    ],
    acuity: 'routine',
  }),
  patient({
    id: 'P-2007',
    name: 'Alex Torres',
    age: 62,
    sex: 'male',
    phone: '555-0710',
    emergencyName: 'Elena Torres',
    emergencyPhone: '555-0711',
    emergencyRelation: 'Spouse',
    arrivalMode: 'referral',
    referringSource: 'Urgent care',
    reason: 'Dizziness — triage pending',
    symptomOnset: 'Today mid-morning',
    symptomDuration: '4 hours',
    painScore: '0',
    allergies: 'Sulfa drugs',
    medications: 'Lisinopril, HCTZ',
    pastMedicalHistory: 'Hypertension; prior syncope workup negative',
    history: [
      {
        id: 'h7',
        at: now(),
        staffId: 'admin-1',
        staffName: 'Clinic Admin',
        summary: 'Added to waiting list.',
      },
    ],
    acuity: 'urgent',
  }),
]

const SEED_DIRECTIVES: AiDirective[] = []

const SEED_THOUGHTS: AiThought[] = [
  {
    id: 'thought-1',
    at: now(),
    message: 'Demo Agent online — assigning waiting patients to free rooms; observing in-room care.',
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
      'Waiting list: Riley Chen, Morgan Blake, Alex Torres — will assign rooms when free.',
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
    agentAssignEnabled: true,
    // Give reviewers time to see the initial waiting queue before the agent acts.
    agentAssignmentNotBefore: Date.now() + 8_000,
    lastAgentTickAt: now(),
    nextSimulationAt: Date.now() + 5_000,
    version: 1,
  }
}
