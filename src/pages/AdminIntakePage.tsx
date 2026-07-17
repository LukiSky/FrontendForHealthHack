import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useClinic } from '../store/clinicStore'
import type { Acuity, Vitals } from '../state/types'
import { nextPatientId } from '../utils/ids'

const emptyVitals: Vitals = {
  height: '',
  weight: '',
  bloodPressure: '',
  heartRate: '',
  temperature: '',
}

export function AdminIntakePage({ embedded = false }: { embedded?: boolean }) {
  const { state, dispatch, isAdminView } = useClinic()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [reason, setReason] = useState('')
  const [roomId, setRoomId] = useState(state.rooms[0]?.id ?? '')
  const [vitals, setVitals] = useState<Vitals>(emptyVitals)
  const [acuity, setAcuity] = useState<Acuity>('routine')

  const availableRooms = state.rooms.filter((r) => r.status !== 'cleaning')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !roomId) return
    const id = nextPatientId(state.patients.map((p) => p.id))
    dispatch({
      type: 'ADMIT_PATIENT',
      payload: {
        id,
        name: name.trim(),
        age: Number(age) || 0,
        reason: reason.trim() || 'General visit',
        vitals,
        roomId,
        acuity,
      },
    })
    navigate('/rooms', {
      state: {
        aiNotified: true,
        patientName: name.trim(),
        roomId,
      },
    })
  }

  return (
    <div className={embedded ? 'space-y-4' : 'mx-auto max-w-2xl space-y-4'}>
      {!embedded && (
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Admin Intake</h1>
          <p className="text-sm text-slate-500">
            Onboard a new patient and assign them to a room. Demo Agent observes only — it will
            not auto-move staff unless a doctor issues a critical must-move.
            {!isAdminView && (
              <span className="ml-1 text-amber-700">
                (Demo open — switch Viewing as to Admin for the Admin menu.)
              </span>
            )}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Patient details
          </legend>
          <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
            Name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Age
            <input
              type="number"
              min={0}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Acuity
            <select
              value={acuity}
              onChange={(e) => setAcuity(e.target.value as Acuity)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
            Assign room
            <select
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            >
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.status})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
            Reason for visit
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </label>
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Vitals
          </legend>
          {(
            [
              ['height', 'Height'],
              ['weight', 'Weight'],
              ['bloodPressure', 'Blood pressure'],
              ['heartRate', 'Heart rate'],
              ['temperature', 'Temperature'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs font-medium text-slate-600">
              {label}
              <input
                value={vitals[key]}
                onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value }))}
                placeholder={
                  key === 'bloodPressure'
                    ? '120/80'
                    : key === 'height'
                      ? '170 cm'
                      : ''
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4" />
          Admit patient
        </button>
      </form>
    </div>
  )
}
