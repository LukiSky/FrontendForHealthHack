import type { Patient, Vitals } from '../state/types'

export interface CopilotSuggestion {
  id: string
  label: string
  detail: string
}

export interface CopilotResult {
  formattedNotes: string
  suggestions: CopilotSuggestion[]
  recommendComplete: boolean
  recommendCleaning: boolean
}

export function runCopilotAssist(
  patient: Patient,
  briefNotes: string,
  vitals: Vitals,
): CopilotResult {
  const lines = briefNotes.trim() || 'No free-text notes provided.'
  const formattedNotes = [
    `SOAP (AI-assisted)`,
    `S: ${patient.reason}. Clinician notes: ${lines}`,
    `O: BP ${vitals.bloodPressure || '—'}, HR ${vitals.heartRate || '—'}, Temp ${vitals.temperature || '—'}, Ht ${vitals.height || '—'}, Wt ${vitals.weight || '—'}.`,
    `A: Working assessment related to ${patient.reason.toLowerCase()}.`,
    `P: Continue evaluation; consider labs if indicated; reassess after interventions.`,
  ].join('\n')

  const suggestions: CopilotSuggestion[] = [
    {
      id: 'lab',
      label: 'Suggest lab order',
      detail: 'Consider basic metabolic panel / CBC if symptoms persist.',
    },
    {
      id: 'followup',
      label: 'Schedule follow-up',
      detail: 'Primary care follow-up in 48–72 hours.',
    },
    {
      id: 'clean',
      label: 'Room needs cleaning',
      detail: 'After consult, mark room for turnover.',
    },
  ]

  if (/chest|cardiac|pressure/i.test(patient.reason + briefNotes)) {
    suggestions.unshift({
      id: 'ecg',
      label: 'Consider ECG',
      detail: 'Chest symptoms — ECG if not already obtained.',
    })
  }

  return {
    formattedNotes,
    suggestions,
    recommendComplete: /done|complete|discharge|stable/i.test(briefNotes),
    recommendCleaning: true,
  }
}
