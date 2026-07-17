import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Flag } from 'lucide-react'
import {
  ACUITY_OPTIONS,
  AGENT_CONDITION_MISTAKE_OPTIONS,
  WRONG_ROOM_REASON_OPTIONS,
  type AgentConditionMistake,
  type WrongRoomReason,
} from '../data/conditionOptions'
import { useClinic } from '../store/clinicStore'
import type { Acuity } from '../state/types'

/** Top-menu page: Demo Agent got patient condition (or room) wrong */
export function RoomAgentFeedbackPage() {
  const { id } = useParams<{ id: string }>()
  const { state, dispatch, viewingStaff } = useClinic()
  const room = state.rooms.find((r) => r.id === id)
  const patient = state.patients.find((p) => p.roomId === id && !p.visitComplete)

  const [mistake, setMistake] = useState<AgentConditionMistake | null>(null)
  const [correctAcuity, setCorrectAcuity] = useState<Acuity | null>(null)
  const [wrongRoomReason, setWrongRoomReason] = useState<WrongRoomReason | null>(null)
  const [suggestedRoomId, setSuggestedRoomId] = useState(
    () => state.rooms.find((r) => r.id !== id && r.status !== 'cleaning')?.id ?? '',
  )
  const [sent, setSent] = useState(false)

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

  if (!patient) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Agent mistake · {room.name}</h1>
        <p className="text-sm text-slate-500">No active patient to report on.</p>
        <Link to={`/room/${room.id}`} className="text-sm text-emerald-700 hover:underline">
          Back to overview
        </Link>
      </div>
    )
  }

  const activePatient = patient
  const roomChoices = state.rooms.filter(
    (r) => r.id !== activePatient.roomId && r.status !== 'cleaning',
  )
  const canReport = viewingStaff?.role === 'doctor'

  function reportConditionMistake() {
    if (!viewingStaff || !mistake) return
    const note = correctAcuity
      ? `${mistake} — correct acuity should be ${correctAcuity}`
      : mistake

    dispatch({
      type: 'AI_THINK',
      payload: {
        message: `Doctor ${viewingStaff.name}: Demo Agent mistake on ${activePatient.name} — ${note}.`,
      },
    })

    if (correctAcuity && correctAcuity !== activePatient.acuity) {
      dispatch({
        type: 'SET_PATIENT_ACUITY',
        payload: {
          patientId: activePatient.id,
          acuity: correctAcuity,
          staffId: viewingStaff.id,
          staffName: viewingStaff.name,
        },
      })
    }

    setSent(true)
    setMistake(null)
  }

  function reportWrongRoom() {
    if (!viewingStaff || !activePatient.roomId || !suggestedRoomId || !wrongRoomReason) return
    dispatch({
      type: 'DOCTOR_REPORT_ROOM_MISTAKE',
      payload: {
        patientId: activePatient.id,
        currentRoomId: activePatient.roomId,
        suggestedRoomId,
        doctorId: viewingStaff.id,
        doctorName: viewingStaff.name,
        note: wrongRoomReason,
      },
    })
    setSent(true)
    setWrongRoomReason(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Agent mistake
        </p>
        <h1 className="text-xl font-semibold text-slate-900">
          Demo Agent wrong about {patient.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Press what the agent got wrong. No typing — feedback goes to the Demo Agent feed.
        </p>
        {!canReport && (
          <p className="mt-2 text-sm text-amber-700">
            Switch Viewing as to a Doctor to submit feedback.
          </p>
        )}
      </div>

      {sent && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Feedback sent to Demo Agent. You can send another or return to overview.
        </div>
      )}

      <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
          <Flag className="h-4 w-4" />
          Wrong about patient condition
        </h2>
        <p className="mt-1 text-xs text-amber-900">
          Current chart: <strong className="capitalize">{patient.acuity}</strong> ·{' '}
          <strong className="capitalize">{patient.carePhase.replace(/_/g, ' ')}</strong>
        </p>

        <p className="mb-1.5 mt-4 text-xs font-medium text-amber-900">What did the agent get wrong?</p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {AGENT_CONDITION_MISTAKE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={!canReport}
              onClick={() => setMistake(opt)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium disabled:opacity-40 ${
                mistake === opt
                  ? 'bg-amber-800 text-white'
                  : 'border border-amber-200 bg-white text-amber-950 hover:bg-amber-100'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <p className="mb-1.5 text-xs font-medium text-amber-900">
          Correct acuity (optional)
        </p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {ACUITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={!canReport}
              onClick={() => setCorrectAcuity(opt.value)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium disabled:opacity-40 ${
                correctAcuity === opt.value
                  ? 'bg-amber-800 text-white'
                  : 'border border-amber-200 bg-white text-amber-950 hover:bg-amber-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!canReport || !mistake}
          onClick={reportConditionMistake}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-800 px-3 py-2 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-40"
        >
          <Flag className="h-4 w-4" />
          Report condition mistake
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Wrong room for this condition</h2>
        <p className="mt-1 text-xs text-slate-500">
          Optional: suggest a better room. Agent logs it; no auto-move.
        </p>

        <p className="mb-1.5 mt-4 text-xs font-medium text-slate-700">Suggested room</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {roomChoices.map((r) => (
            <button
              key={r.id}
              type="button"
              disabled={!canReport}
              onClick={() => setSuggestedRoomId(r.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-40 ${
                suggestedRoomId === r.id
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>

        <p className="mb-1.5 text-xs font-medium text-slate-700">Reason</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {WRONG_ROOM_REASON_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={!canReport}
              onClick={() => setWrongRoomReason(opt)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-40 ${
                wrongRoomReason === opt
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!canReport || !suggestedRoomId || !wrongRoomReason}
          onClick={reportWrongRoom}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
        >
          Report wrong room
        </button>
      </section>

      <Link to={`/room/${room.id}`} className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to room overview
      </Link>
    </div>
  )
}
