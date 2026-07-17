import { useEffect, useState, type Dispatch, type FormEvent } from 'react'
import { UserPlus } from 'lucide-react'
import { peekNextPatientId } from '../../utils/ids'
import type { SimulationAction, TriageLevel } from '../../state/types'

interface AdminIntakeFormProps {
  dispatch: Dispatch<SimulationAction>
  admitNonce: number
}

export function AdminIntakeForm({ dispatch, admitNonce }: AdminIntakeFormProps) {
  const [patientId, setPatientId] = useState(peekNextPatientId)
  const [name, setName] = useState('')
  const [triageLevel, setTriageLevel] = useState<TriageLevel>(3)

  useEffect(() => {
    setPatientId(peekNextPatientId())
  }, [admitNonce])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!patientId.trim()) return
    dispatch({
      type: 'ADMIT_PATIENT',
      payload: {
        id: patientId.trim(),
        name: name.trim() || 'Unnamed Patient',
        triageLevel,
      },
    })
    setName('')
    setTriageLevel(3)
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <UserPlus className="h-4 w-4 text-emerald-600" />
        <h2 className="text-sm font-semibold text-slate-800">Admin Intake</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 p-4 sm:grid-cols-2">
        <label className="block text-xs font-medium text-slate-600">
          Patient ID
          <input
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Patient name"
            className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>

        <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
          Initial Triage Level
          <select
            value={triageLevel}
            onChange={(e) => setTriageLevel(Number(e.target.value) as TriageLevel)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value={1}>1 — Critical</option>
            <option value={2}>2 — Urgent</option>
            <option value={3}>3 — Standard</option>
          </select>
        </label>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 sm:col-span-2"
        >
          <UserPlus className="h-4 w-4" />
          Admit to Triage
        </button>
      </form>
    </section>
  )
}
