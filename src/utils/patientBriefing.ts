import type { Patient } from '../state/types'

export type PatientBriefing = {
  /** One-line: what is going on right now */
  whatsGoingOn: string
  /** Longer description built from acuity, phase, reason, vitals, notes */
  conditionDescription: string
  /** Short bullets for quick scan */
  highlights: string[]
}

function phaseLabel(phase: Patient['carePhase']): string {
  switch (phase) {
    case 'awaiting_vitals':
      return 'waiting for vitals'
    case 'awaiting_exam':
      return 'ready for doctor exam'
    case 'in_consult':
      return 'already in consult'
    case 'complete':
      return 'visit complete'
    default:
      return phase
  }
}

function acuityPhrase(acuity: Patient['acuity']): string {
  switch (acuity) {
    case 'critical':
      return 'Critical acuity — needs immediate attention'
    case 'urgent':
      return 'Urgent — should be seen soon'
    default:
      return 'Routine acuity'
  }
}

function vitalHints(p: Patient): string[] {
  const hints: string[] = []
  const hr = Number.parseInt(p.vitals.heartRate, 10)
  const bp = p.vitals.bloodPressure
  const rr = Number.parseInt(p.vitals.respiratoryRate, 10)
  const spo2 = Number.parseInt(p.vitals.spo2, 10)
  if (!Number.isNaN(hr)) {
    if (hr >= 110) hints.push(`Elevated heart rate (${p.vitals.heartRate})`)
    else if (hr > 0 && hr <= 50) hints.push(`Low heart rate (${p.vitals.heartRate})`)
  }
  if (bp && bp.includes('/')) {
    const sys = Number.parseInt(bp.split('/')[0] ?? '', 10)
    if (!Number.isNaN(sys) && sys > 0) {
      if (sys < 100) hints.push(`Low blood pressure (${bp})`)
      else if (sys >= 160) hints.push(`High blood pressure (${bp})`)
    }
  }
  if (p.vitals.temperature) {
    const t = Number.parseFloat(p.vitals.temperature)
    if (!Number.isNaN(t) && t >= 38) hints.push(`Fever (${p.vitals.temperature})`)
  }
  if (!Number.isNaN(rr) && rr >= 24) hints.push(`Tachypnea (RR ${p.vitals.respiratoryRate})`)
  if (!Number.isNaN(spo2) && spo2 > 0 && spo2 < 92) {
    hints.push(`Low SpO₂ (${p.vitals.spo2}%)`)
  }
  return hints
}

/** Build a short narrative from current patient condition fields (before doctor chooses). */
export function buildPatientBriefing(patient: Patient): PatientBriefing {
  const displayName = patient.preferredName?.trim()
    ? `${patient.name} (“${patient.preferredName.trim()}”)`
    : patient.name
  const phase = phaseLabel(patient.carePhase)
  const onsetBits = [
    patient.symptomOnset?.trim() && `onset ${patient.symptomOnset.trim()}`,
    patient.symptomDuration?.trim() && `duration ${patient.symptomDuration.trim()}`,
    patient.painScore?.trim() && `pain ${patient.painScore.trim()}/10`,
  ].filter(Boolean)

  const whatsGoingOn = `${displayName} (${patient.age}) is in for ${patient.reason.toLowerCase()}, currently ${phase}. ${acuityPhrase(patient.acuity)}.`

  const vitalBits = vitalHints(patient)
  const vitalsLine =
    patient.vitals.bloodPressure || patient.vitals.heartRate
      ? `Recorded vitals: BP ${patient.vitals.bloodPressure || '—'}, HR ${patient.vitals.heartRate || '—'}, RR ${patient.vitals.respiratoryRate || '—'}, SpO₂ ${patient.vitals.spo2 || '—'}, temp ${patient.vitals.temperature || '—'}.`
      : 'Vitals not fully recorded yet.'

  const allergyLine = patient.allergies?.trim()
    ? `Allergies: ${patient.allergies.trim()}.`
    : 'No allergies documented.'
  const medsLine = patient.medications?.trim()
    ? `Medications: ${patient.medications.trim()}.`
    : ''
  const pmhLine = patient.pastMedicalHistory?.trim()
    ? `PMH: ${patient.pastMedicalHistory.trim()}.`
    : ''
  const notesLine = patient.notes?.trim()
    ? `Chart note: ${patient.notes.trim()}`
    : 'No extra chart notes yet.'

  const conditionDescription = [
    `${displayName} presented with ${patient.reason}${onsetBits.length ? ` (${onsetBits.join(', ')})` : ''}.`,
    `Care status: ${phase}; triage is ${patient.acuity}.`,
    allergyLine,
    medsLine,
    pmhLine,
    vitalsLine,
    notesLine,
    vitalBits.length > 0
      ? `Concerning findings: ${vitalBits.join('; ')}.`
      : 'No automatic vital red flags from the chart.',
  ]
    .filter(Boolean)
    .join(' ')

  const highlights = [
    `Acuity: ${patient.acuity}`,
    `Phase: ${patient.carePhase.replace(/_/g, ' ')}`,
    patient.reason,
    ...(patient.allergies?.trim() ? [`Allergies: ${patient.allergies.trim()}`] : []),
    ...(patient.painScore?.trim() ? [`Pain ${patient.painScore}/10`] : []),
    ...vitalBits.slice(0, 2),
  ]

  return { whatsGoingOn, conditionDescription, highlights }
}
