import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LogOut, PhoneCall, SkipForward } from 'lucide-react'
import {
  ACUITY_OPTIONS,
  CARE_PHASE_OPTIONS,
  LEAVE_CONDITION_OPTIONS,
  type LeaveCondition,
} from '../data/conditionOptions'
import { useClinic } from '../store/clinicStore'
import type { Acuity, CarePhase, Vitals } from '../state/types'

/** Update care: condition chips + skip — call staff is its own menu page */
export function RoomCarePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { state, dispatch, viewingStaff, isStaffView } = useClinic()
  const room = state.rooms.find((r) => r.id === id)
  const patient = state.patients.find((p) => p.roomId === id && !p.visitComplete)

  const [acuity, setAcuity] = useState<Acuity>(patient?.acuity ?? 'routine')
  const [phase, setPhase] = useState<CarePhase>(
    patient?.carePhase === 'awaiting_vitals' && viewingStaff?.role === 'nurse'
      ? 'awaiting_exam'
      : patient?.carePhase === 'complete'
        ? 'in_consult'
        : (patient?.carePhase ?? 'in_consult'),
  )
  const [vitals, setVitals] = useState<Vitals>(patient?.vitals ?? {
    height: '',
    weight: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    spo2: '',
  })
  const [condition, setCondition] = useState<LeaveCondition | null>(null)

  if (!room) {
    return (
      <div className="space-y-3">
        <p className="text-slate-600">Room not found.</p>
        <Link to="/rooms" className="text-sm text-emerald-700 hover:underline">
          Back to rooms
        </Link>
      </div>
    )
  }

  const isCaring = Boolean(viewingStaff && viewingStaff.currentRoomId === room.id)

  if (isStaffView && viewingStaff && viewingStaff.role !== 'admin' && !isCaring) {
    return (
      <div className="mx-auto max-w-lg space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold text-amber-950">Take care first</h1>
        <p className="text-sm text-amber-900">
          Update care is available after you take care of this patient.
        </p>
        <Link
          to={`/room/${room.id}`}
          className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Go to patient detail
        </Link>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Update care · {room.name}</h1>
        <p className="text-sm text-slate-500">No active patient in this room.</p>
        <Link to={`/room/${room.id}`} className="text-sm text-emerald-700 hover:underline">
          Back to overview
        </Link>
      </div>
    )
  }

  const roomName = room.name
  const roomId = room.id
  const activePatient = patient

  function saveAndLeave() {
    if (!viewingStaff || !condition) return
    const visitComplete = phase === 'complete'
    const nextNotes = activePatient.notes
      ? `${activePatient.notes}\n[Leave] ${condition}`
      : `[Leave] ${condition}`

    dispatch({
      type: 'UPDATE_PATIENT',
      payload: {
        patientId: activePatient.id,
        vitals,
        notes: nextNotes,
        visitComplete,
        staffId: viewingStaff.id,
        staffName: viewingStaff.name,
        carePhase: phase,
        acuity,
      },
    })
    dispatch({
      type: 'AI_THINK',
      payload: {
        message: `${viewingStaff.name} left ${roomName}: ${acuity}, ${phase.replace(/_/g, ' ')}, ${condition}.`,
      },
    })
    dispatch({
      type: 'SET_STAFF_LOCATION',
      payload: { staffId: viewingStaff.id, roomId: null },
    })
    navigate('/my-dashboard')
  }

  function skipPatient() {
    if (!viewingStaff) return
    const nextNotes = activePatient.notes
      ? `${activePatient.notes}\n[Skipped] Doctor deferred this visit`
      : '[Skipped] Doctor deferred this visit'
    dispatch({
      type: 'UPDATE_PATIENT',
      payload: {
        patientId: activePatient.id,
        vitals: activePatient.vitals,
        notes: nextNotes,
        visitComplete: false,
        staffId: viewingStaff.id,
        staffName: viewingStaff.name,
        carePhase: activePatient.carePhase,
        acuity: activePatient.acuity,
      },
    })
    dispatch({
      type: 'AI_THINK',
      payload: {
        message: `${viewingStaff.name} skipped ${activePatient.name} in ${roomName} — deferred for later.`,
      },
    })
    dispatch({
      type: 'SET_STAFF_LOCATION',
      payload: { staffId: viewingStaff.id, roomId: null },
    })
    navigate('/my-dashboard')
  }

  const canUpdate = isStaffView && Boolean(viewingStaff)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Update care
        </p>
        <h1 className="text-xl font-semibold text-slate-900">
          {patient.name} · {room.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Finish here to unlock other rooms — save condition & leave, or skip this patient.
        </p>
      </div>

      {/* Update condition + leave */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Update patient condition</h2>
        <p className="mt-1 text-xs text-slate-500">Required before you leave this visit.</p>

        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Acuity
            </p>
            <div className="flex flex-wrap gap-2">
              {ACUITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAcuity(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    acuity === opt.value
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Care phase
            </p>
            <div className="flex flex-wrap gap-2">
              {CARE_PHASE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPhase(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    phase === opt.value
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {activePatient.carePhase === 'awaiting_vitals' && viewingStaff?.role === 'nurse' && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Record vitals
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ['bloodPressure', 'Blood pressure'],
                    ['heartRate', 'Heart rate'],
                    ['temperature', 'Temperature'],
                    ['respiratoryRate', 'Respiratory rate'],
                    ['spo2', 'SpO₂'],
                    ['weight', 'Weight'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="text-xs font-medium text-slate-600">
                    {label}
                    <input
                      value={vitals[key]}
                      onChange={(e) =>
                        setVitals((previous) => ({ ...previous, [key]: e.target.value }))
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Condition
            </p>
            <div className="flex flex-wrap gap-2">
              {LEAVE_CONDITION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCondition(opt)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    condition === opt
                      ? 'bg-emerald-700 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!canUpdate || !condition}
          onClick={saveAndLeave}
          className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          <LogOut className="h-4 w-4" />
          Save condition & leave
        </button>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <SkipForward className="h-4 w-4 text-slate-500" />
            Skip this patient
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Leave the room without finishing. Patient stays active for later.
          </p>
          <button
            type="button"
            disabled={!canUpdate}
            onClick={skipPatient}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
          >
            Skip & leave room
          </button>
        </section>

        <section className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-red-950">
            <PhoneCall className="h-4 w-4 text-red-700" />
            Need help now?
          </h2>
          <p className="mt-1 text-xs text-red-800">
            Call another doctor or nurse from the Call staff menu — without leaving this patient.
          </p>
          <Link
            to={`/room/${roomId}/call`}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            <PhoneCall className="h-4 w-4" />
            Open Call staff
          </Link>
        </section>
      </div>

      <Link to={`/room/${roomId}`} className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to patient detail
      </Link>
    </div>
  )
}
