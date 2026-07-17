import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  ClipboardEdit,
  Eye,
  HandHelping,
  MapPin,
  Stethoscope,
  User,
  Users,
} from 'lucide-react'
import { AcuityBadge } from '../components/AcuityBadge'
import { useClinic } from '../store/clinicStore'
import type { Acuity, Patient, Room } from '../state/types'
import { buildPatientBriefing } from '../utils/patientBriefing'
import { getCareLock } from '../utils/careLock'
import {
  distanceFromStaffToRoom,
  formatDistance,
  positionOfStaff,
} from '../utils/distance'

const ACUITY_ORDER: Acuity[] = ['routine', 'urgent', 'critical']

function acuityRank(a: Acuity): number {
  return ACUITY_ORDER.indexOf(a)
}

function needsDoctorAttention(p: Patient): boolean {
  if (p.visitComplete || !p.roomId) return false
  return (
    p.acuity === 'critical' ||
    p.acuity === 'urgent' ||
    p.carePhase === 'awaiting_exam' ||
    p.carePhase === 'in_consult'
  )
}

/**
 * Doctor / nurse flow:
 * 1. List — short summary
 * 2. Look at patient detail — read full condition (no claim yet)
 * 3. Take care of this patient — claim room; button becomes Update care
 * 4. Update care — change condition / skip / call
 */
export function MyStaffDashboardPage() {
  const { state, dispatch, viewingStaff, isStaffView, setViewingAs } = useClinic()
  const navigate = useNavigate()
  const clinicians = state.staff.filter((s) => s.role !== 'admin')

  if (!isStaffView || !viewingStaff || viewingStaff.role === 'admin') {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Viewing as · Staff
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Staff Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pick a Doctor or Nurse in “Viewing as” to open their patient list.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clinicians.map((s) => {
            const room = state.rooms.find((r) => r.id === s.currentRoomId)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setViewingAs(s.id)}
                className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-400"
              >
                <div className="mb-2 flex items-center gap-2">
                  {s.role === 'doctor' ? (
                    <Stethoscope className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <User className="h-5 w-5 text-sky-600" />
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <p className="text-xs capitalize text-slate-500">
                      {s.role} · {s.specialty}
                    </p>
                  </div>
                </div>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {room?.name ?? 'Not in a room'}
                </p>
              </button>
            )
          })}
        </div>
        <Link
          to="/move"
          className="inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:underline"
        >
          <Users className="h-4 w-4" />
          Staff movement
        </Link>
      </div>
    )
  }

  const staff = viewingStaff
  const fromLabel = positionOfStaff(staff, state.rooms).label
  const careLock = getCareLock(staff, state.patients)
  const caringRoomId = careLock?.roomId ?? null

  // Locked into a patient — stay on that room until Update care finishes
  if (careLock) {
    const room = state.rooms.find((r) => r.id === careLock.roomId)
    const briefing = buildPatientBriefing(careLock.patient)
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Locked to patient
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            {careLock.patient.name}
          </h1>
          <p className="mt-1 text-sm text-emerald-900">
            {room?.name ?? 'Room'} — finish Update care before you can see other patients.
          </p>
          <p className="mt-3 text-sm text-slate-700">{briefing.whatsGoingOn}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(`/room/${careLock.roomId}`)}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400 bg-white px-4 py-2.5 text-sm font-medium text-emerald-950"
            >
              <Eye className="h-4 w-4" />
              Patient detail
            </button>
            <button
              type="button"
              onClick={() => navigate(`/room/${careLock.roomId}/care`)}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white"
            >
              <ClipboardEdit className="h-4 w-4" />
              Update care
            </button>
          </div>
        </div>
      </div>
    )
  }

  function openPatientDetail(room: Room) {
    navigate(`/room/${room.id}`)
  }

  /** Claim this patient — locks you to that room */
  function takeCareOfPatient(room: Room) {
    dispatch({
      type: 'SET_STAFF_LOCATION',
      payload: { staffId: staff.id, roomId: room.id },
    })
    navigate(`/room/${room.id}`)
  }

  function openUpdateCare(room: Room) {
    navigate(`/room/${room.id}/care`)
  }

  if (staff.role === 'doctor') {
    const assignments = state.patients
      .filter(needsDoctorAttention)
      .map((p) => {
        const room = state.rooms.find((r) => r.id === p.roomId)!
        return {
          patient: p,
          room,
          distance: distanceFromStaffToRoom(staff, room, state.rooms),
          briefing: buildPatientBriefing(p),
          isCaring: caringRoomId === room.id,
        }
      })
      .filter((a) => a.room)
      .sort((a, b) => {
        // Patient you are caring for first, then acuity, then distance
        if (a.isCaring !== b.isCaring) return a.isCaring ? -1 : 1
        const acuityDiff = acuityRank(b.patient.acuity) - acuityRank(a.patient.acuity)
        if (acuityDiff !== 0) return acuityDiff
        return a.distance - b.distance
      })

    const closestId =
      assignments.length > 0
        ? [...assignments].sort((a, b) => a.distance - b.distance)[0]?.patient.id
        : null

    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Doctor · {staff.name}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Patients needing you</h1>
          <p className="mt-1 text-sm text-slate-500">
            From <strong>{fromLabel}</strong>. Look at detail, or take care of a patient. After
            you take care, the button becomes <strong>Update care</strong>.
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            No patients need a doctor right now.
          </div>
        ) : (
          <ul className="space-y-4">
            {assignments.map(({ patient, room, distance, briefing, isCaring }, index) => (
              <li
                key={patient.id}
                className={`rounded-xl border bg-white p-5 shadow-sm ${
                  isCaring
                    ? 'border-emerald-400 ring-1 ring-emerald-200'
                    : patient.acuity === 'critical'
                      ? 'border-red-300'
                      : patient.acuity === 'urgent'
                        ? 'border-amber-300'
                        : 'border-slate-200'
                }`}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {room.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-sky-700">
                    <MapPin className="h-3 w-3" />
                    {formatDistance(distance)}
                  </span>
                  {isCaring && (
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      You are caring
                    </span>
                  )}
                  {!isCaring && patient.id === closestId && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      Closest
                    </span>
                  )}
                  {!isCaring && index === 0 && (
                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Suggested next
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-semibold text-slate-900">{patient.name}</h2>
                <div className="mt-2">
                  <AcuityBadge acuity={patient.acuity} />
                </div>
                <p className="mt-2 text-sm font-medium text-slate-800">{briefing.whatsGoingOn}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {briefing.highlights.slice(0, 3).map((h) => (
                    <li
                      key={h}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-700"
                    >
                      {h}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openPatientDetail(room)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    Look at patient detail
                  </button>
                  {isCaring ? (
                    <button
                      type="button"
                      onClick={() => openUpdateCare(room)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
                    >
                      <ClipboardEdit className="h-4 w-4" />
                      Update care
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => takeCareOfPatient(room)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      <HandHelping className="h-4 w-4" />
                      Take care of this patient
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // Nurse
  const nurseAssignments = state.patients
    .filter((p) => !p.visitComplete && p.roomId && p.carePhase === 'awaiting_vitals')
    .map((p) => {
      const room = state.rooms.find((r) => r.id === p.roomId)!
      return {
        patient: p,
        room,
        distance: distanceFromStaffToRoom(staff, room, state.rooms),
        briefing: buildPatientBriefing(p),
        isCaring: caringRoomId === room.id,
      }
    })
    .filter((a) => a.room)
    .sort((a, b) => {
      if (a.isCaring !== b.isCaring) return a.isCaring ? -1 : 1
      return a.distance - b.distance
    })

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
          Nurse · {staff.name}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Patients needing vitals</h1>
        <p className="mt-1 text-sm text-slate-500">
          From <strong>{fromLabel}</strong>. Take care first; then the button becomes Update care.
        </p>
      </div>
      {nurseAssignments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          No rooms waiting for vitals.
        </div>
      ) : (
        <ul className="space-y-4">
          {nurseAssignments.map(({ patient, room, distance, briefing, isCaring }, idx) => (
            <li
              key={patient.id}
              className={`rounded-xl border bg-white p-5 shadow-sm ${
                isCaring ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-200'
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold uppercase">{room.name}</span>
                <span className="flex items-center gap-1 font-medium text-sky-700">
                  <MapPin className="h-3 w-3" />
                  {formatDistance(distance)}
                </span>
                {isCaring && (
                  <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    You are caring
                  </span>
                )}
                {!isCaring && idx === 0 && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                    Closest
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{patient.name}</h2>
              <div className="mt-2">
                <AcuityBadge acuity={patient.acuity} />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-800">{briefing.whatsGoingOn}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openPatientDetail(room)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" />
                  Look at patient detail
                </button>
                {isCaring ? (
                  <button
                    type="button"
                    onClick={() => openUpdateCare(room)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
                  >
                    <ClipboardEdit className="h-4 w-4" />
                    Update care
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => takeCareOfPatient(room)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <HandHelping className="h-4 w-4" />
                    Take care of this patient
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function nextAcuity(current: Acuity, dir: 1 | -1): Acuity {
  const i = ACUITY_ORDER.indexOf(current)
  const n = Math.min(ACUITY_ORDER.length - 1, Math.max(0, i + dir))
  return ACUITY_ORDER[n]!
}

export function TriageControls({
  patient,
  staffId,
  staffName,
}: {
  patient: Patient
  staffId: string
  staffName: string
}) {
  const { dispatch } = useClinic()

  function bump(dir: 1 | -1) {
    const acuity = nextAcuity(patient.acuity, dir)
    if (acuity === patient.acuity) return
    dispatch({
      type: 'SET_PATIENT_ACUITY',
      payload: { patientId: patient.id, acuity, staffId, staffName },
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-xs font-semibold uppercase text-slate-500">Triage level</span>
      <span
        className={`rounded px-2 py-0.5 text-sm font-semibold capitalize ${
          patient.acuity === 'critical'
            ? 'bg-red-100 text-red-800'
            : patient.acuity === 'urgent'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-sky-100 text-sky-800'
        }`}
      >
        {patient.acuity}
      </span>
      <button
        type="button"
        title="Escalate (more critical)"
        onClick={() => bump(1)}
        disabled={patient.acuity === 'critical'}
        className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40"
      >
        <ArrowUp className="h-3 w-3" /> Up
      </button>
      <button
        type="button"
        title="De-escalate (less critical)"
        onClick={() => bump(-1)}
        disabled={patient.acuity === 'routine'}
        className="inline-flex items-center gap-1 rounded border border-sky-200 bg-white px-2 py-1 text-xs text-sky-700 hover:bg-sky-50 disabled:opacity-40"
      >
        <ArrowDown className="h-3 w-3" /> Down
      </button>
    </div>
  )
}
