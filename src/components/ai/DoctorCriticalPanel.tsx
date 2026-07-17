import { useState } from 'react'
import { AlertTriangle, Flag, Siren } from 'lucide-react'
import {
  ACUITY_OPTIONS,
  MUST_MOVE_REASON_OPTIONS,
  WRONG_ROOM_REASON_OPTIONS,
  type MustMoveReason,
  type WrongRoomReason,
} from '../../data/conditionOptions'
import { useClinic } from '../../store/clinicStore'
import type { Acuity, Patient } from '../../state/types'

function chipClass(active: boolean, tone: 'red' | 'amber' | 'slate' = 'slate') {
  if (active) {
    if (tone === 'red') return 'bg-red-700 text-white'
    if (tone === 'amber') return 'bg-amber-800 text-white'
    return 'bg-slate-900 text-white'
  }
  if (tone === 'red') {
    return 'border border-red-200 bg-white text-red-900 hover:bg-red-100'
  }
  if (tone === 'amber') {
    return 'border border-amber-200 bg-white text-amber-950 hover:bg-amber-100'
  }
  return 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
}

export function DoctorCriticalPanel({ patient }: { patient: Patient }) {
  const { state, dispatch, viewingStaff } = useClinic()
  const [staffId, setStaffId] = useState(
    () =>
      state.staff.find((s) => s.role === 'nurse' && !s.currentTaskId)?.id ??
      state.staff.find((s) => s.role === 'nurse')?.id ??
      '',
  )
  const [note, setNote] = useState<MustMoveReason | null>(null)
  const [suggestedRoomId, setSuggestedRoomId] = useState(
    () => state.rooms.find((r) => r.id !== patient.roomId && r.status !== 'cleaning')?.id ?? '',
  )
  const [feedback, setFeedback] = useState<WrongRoomReason | null>(null)

  if (!viewingStaff || viewingStaff.role !== 'doctor' || !patient.roomId) return null

  const clinicians = state.staff.filter((s) => s.role === 'nurse' || s.role === 'doctor')
  const roomChoices = state.rooms.filter(
    (r) => r.id !== patient.roomId && r.status !== 'cleaning',
  )

  function setAcuity(acuity: Acuity) {
    dispatch({
      type: 'SET_PATIENT_ACUITY',
      payload: {
        patientId: patient.id,
        acuity,
        staffId: viewingStaff!.id,
        staffName: viewingStaff!.name,
      },
    })
  }

  function issueMustMove() {
    if (!staffId || !patient.roomId || !note) return
    dispatch({
      type: 'DOCTOR_MARK_CRITICAL_MOVE',
      payload: {
        patientId: patient.id,
        roomId: patient.roomId,
        staffId,
        doctorId: viewingStaff!.id,
        doctorName: viewingStaff!.name,
        note,
      },
    })
    setNote(null)
  }

  function reportMistake() {
    if (!patient.roomId || !suggestedRoomId || !feedback) return
    dispatch({
      type: 'DOCTOR_REPORT_ROOM_MISTAKE',
      payload: {
        patientId: patient.id,
        currentRoomId: patient.roomId,
        suggestedRoomId,
        doctorId: viewingStaff!.id,
        doctorName: viewingStaff!.name,
        note: feedback,
      },
    })
    setFeedback(null)
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="rounded-lg border-2 border-red-300 bg-red-50 p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Siren className="h-5 w-5 text-red-700" />
          <h2 className="text-sm font-semibold text-red-950">Critical override (demo)</h2>
        </div>
        <p className="mb-3 text-xs text-red-800">
          The Demo Agent runs routine rounds. Use this control to declare a must-move when this
          patient's condition needs an immediate, clinician-directed response.
        </p>

        <p className="mb-1.5 text-xs font-medium text-red-900">Patient acuity</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {ACUITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAcuity(opt.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${chipClass(
                patient.acuity === opt.value,
                'red',
              )}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="mb-1.5 text-xs font-medium text-red-900">Require staff now</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {clinicians.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStaffId(s.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${chipClass(
                staffId === s.id,
                'red',
              )}`}
            >
              {s.name} ({s.role})
            </button>
          ))}
        </div>

        <p className="mb-1.5 text-xs font-medium text-red-900">Why is this a must?</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {MUST_MOVE_REASON_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setNote(opt)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${chipClass(
                note === opt,
                'red',
              )}`}
            >
              {opt}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={issueMustMove}
          disabled={!staffId || !note}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <AlertTriangle className="h-4 w-4" />
          Require staff now (must move)
        </button>
      </section>

      <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Flag className="h-5 w-5 text-amber-800" />
          <h2 className="text-sm font-semibold text-amber-950">Help the Demo Agent</h2>
        </div>
        <p className="mb-3 text-xs text-amber-900">
          If this room looks wrong for the patient&apos;s condition, press a reason. The agent
          logs feedback — it will not auto-relocate unless you also issue a must-move.
        </p>

        <p className="mb-1.5 text-xs font-medium text-amber-900">Suggested better room</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {roomChoices.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSuggestedRoomId(r.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${chipClass(
                suggestedRoomId === r.id,
                'amber',
              )}`}
            >
              {r.name}
            </button>
          ))}
        </div>

        <p className="mb-1.5 text-xs font-medium text-amber-900">What&apos;s wrong?</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {WRONG_ROOM_REASON_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFeedback(opt)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${chipClass(
                feedback === opt,
                'amber',
              )}`}
            >
              {opt}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={reportMistake}
          disabled={!suggestedRoomId || !feedback}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-amber-400 bg-white px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Flag className="h-4 w-4" />
          Report wrong room for acuity
        </button>
      </section>
    </div>
  )
}
