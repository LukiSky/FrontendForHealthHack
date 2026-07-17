import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, PhoneCall, Siren, UserRound } from 'lucide-react'
import { useClinic } from '../store/clinicStore'
import { getCareLock } from '../utils/careLock'
import {
  buildStaffNeedOptions,
  CALL_WHY_OPTIONS,
  pickStaffForNeed,
  type CallWhy,
  type StaffNeedOption,
} from '../utils/staffCall'
import { formatDistance, distanceFromStaffToRoom } from '../utils/distance'

/**
 * Call staff:
 * - Immediate hands = one button (no extra choices)
 * - Other help = pick type + reason, then send
 */
export function RoomCallStaffPage() {
  const { id } = useParams<{ id: string }>()
  const { state, dispatch, viewingStaff, isStaffView } = useClinic()
  const room = state.rooms.find((r) => r.id === id)
  const patient = state.patients.find((p) => p.roomId === id && !p.visitComplete)
  const careLock =
    isStaffView && viewingStaff ? getCareLock(viewingStaff, state.patients) : null

  const needOptions = useMemo(
    () => buildStaffNeedOptions(state.staff, viewingStaff?.id),
    [state.staff, viewingStaff?.id],
  )

  const [needId, setNeedId] = useState('nurse')
  const [why, setWhy] = useState<CallWhy | null>(null)
  const [lastAssigned, setLastAssigned] = useState<string | null>(null)

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

  const isCaring = Boolean(viewingStaff && viewingStaff.currentRoomId === room.id && patient)

  if (!isCaring || !patient) {
    return (
      <div className="mx-auto max-w-lg space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold text-amber-950">Take care first</h1>
        <p className="text-sm text-amber-900">
          Call staff is available after you take care of a patient in this room.
        </p>
        <Link
          to={careLock ? `/room/${careLock.roomId}` : `/room/${room.id}`}
          className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Go to patient detail
        </Link>
      </div>
    )
  }

  const activePatient = patient
  const roomId = room.id
  const roomName = room.name
  const activeRoom = room
  const canCall = viewingStaff?.role === 'doctor' || viewingStaff?.role === 'nurse'

  const selectedNeed: StaffNeedOption | undefined =
    needOptions.find((o) => o.id === needId) ?? needOptions[0]

  const preview = selectedNeed
    ? pickStaffForNeed(
        state.staff,
        state.rooms,
        activeRoom,
        selectedNeed.need,
        viewingStaff?.id,
      )
    : null

  const previewDistance = preview
    ? distanceFromStaffToRoom(preview, activeRoom, state.rooms)
    : null

  /** One-tap urgent: nearest free nurse, else nearest free doctor, else closest anyone */
  function callHandsImmediately() {
    if (!viewingStaff || !activePatient.roomId) return

    const nurse =
      pickStaffForNeed(
        state.staff,
        state.rooms,
        activeRoom,
        { kind: 'nurse' },
        viewingStaff.id,
      )
    const doctor =
      pickStaffForNeed(
        state.staff,
        state.rooms,
        activeRoom,
        { kind: 'doctor' },
        viewingStaff.id,
      )
    const assignee = nurse ?? doctor
    if (!assignee) return

    dispatch({
      type: 'DOCTOR_MARK_CRITICAL_MOVE',
      payload: {
        patientId: activePatient.id,
        roomId: activePatient.roomId,
        staffId: assignee.id,
        doctorId: viewingStaff.id,
        doctorName: viewingStaff.name,
        note: 'Need hands immediately',
      },
    })

    setLastAssigned(
      `${assignee.name} (${assignee.role}) — coming to ${roomName} now (hands immediately)`,
    )
  }

  function callWithOptions() {
    if (!viewingStaff || !activePatient.roomId || !selectedNeed || !why) return
    const assignee = pickStaffForNeed(
      state.staff,
      state.rooms,
      activeRoom,
      selectedNeed.need,
      viewingStaff.id,
    )
    if (!assignee) return

    dispatch({
      type: 'DOCTOR_MARK_CRITICAL_MOVE',
      payload: {
        patientId: activePatient.id,
        roomId: activePatient.roomId,
        staffId: assignee.id,
        doctorId: viewingStaff.id,
        doctorName: viewingStaff.name,
        note: `Need ${selectedNeed.label.toLowerCase()} — ${why}`,
      },
    })

    setLastAssigned(
      `${assignee.name} (${selectedNeed.label}) — ${why}`,
    )
    setWhy(null)
  }

  const urgentAvailable = Boolean(
    pickStaffForNeed(state.staff, state.rooms, activeRoom, { kind: 'nurse' }, viewingStaff?.id) ||
      pickStaffForNeed(state.staff, state.rooms, activeRoom, { kind: 'doctor' }, viewingStaff?.id),
  )

  // Reasons for the options flow — exclude the one-tap immediate case
  const optionWhys = CALL_WHY_OPTIONS.filter((w) => w !== 'Need hands immediately')

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
          Call staff
        </p>
        <h1 className="text-xl font-semibold text-slate-900">Need help in this room</h1>
        <p className="mt-1 text-sm text-slate-500">
          {activePatient.name} · {roomName}
        </p>
      </div>

      {lastAssigned && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Call sent</p>
            <p className="mt-0.5">{lastAssigned}</p>
          </div>
        </div>
      )}

      {/* One-press urgent */}
      <section className="rounded-xl border-2 border-red-400 bg-red-50 p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-red-950">
          <Siren className="h-5 w-5 shrink-0 text-red-700" />
          <div>
            <p className="text-sm font-semibold">Urgent</p>
            <p className="text-xs text-red-800">
              One tap — system sends the nearest available nurse (or doctor).
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={!canCall || !urgentAvailable}
          onClick={callHandsImmediately}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-3.5 text-base font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PhoneCall className="h-5 w-5" />
          Need hands immediately
        </button>
      </section>

      {/* Non-urgent: type + reason */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Other help (choose options)</p>
        <p className="mt-1 text-xs text-slate-500">
          Pick the type of staff and a reason, then send.
        </p>

        <p className="mb-2 mt-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <UserRound className="h-3.5 w-3.5" />
          Who do you need?
        </p>
        <div className="flex flex-wrap gap-2">
          {needOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={!canCall}
              onClick={() => setNeedId(opt.id)}
              className={`rounded-md px-3 py-2 text-left text-sm font-medium disabled:opacity-40 ${
                needId === opt.id
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span className="block">{opt.label}</span>
              <span
                className={`mt-0.5 block text-[11px] font-normal ${
                  needId === opt.id ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {opt.availableCount > 0
                  ? `${opt.availableCount} free`
                  : 'None free — closest busy'}
              </span>
            </button>
          ))}
        </div>

        {preview && (
          <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Will send: <strong className="text-slate-900">{preview.name}</strong>
            {preview.currentRoomId ? ' (busy)' : ' (free)'}
            {previewDistance !== null && previewDistance > 0
              ? ` · ${formatDistance(previewDistance)}`
              : ''}
          </p>
        )}

        <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Reason
        </p>
        <div className="flex flex-wrap gap-1.5">
          {optionWhys.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={!canCall}
              onClick={() => setWhy(opt)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium disabled:opacity-40 ${
                why === opt
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
          disabled={!canCall || !preview || !why}
          onClick={callWithOptions}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40"
        >
          <PhoneCall className="h-4 w-4" />
          Send call
        </button>
      </section>

      <Link
        to={`/room/${roomId}`}
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Back to patient detail
      </Link>
    </div>
  )
}
