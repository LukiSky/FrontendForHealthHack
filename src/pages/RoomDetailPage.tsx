import { useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BedDouble,
  ClipboardEdit,
  Clock,
  HandHelping,
  Lock,
  MapPin,
  PhoneCall,
  Radio,
  Users,
} from 'lucide-react'
import { AcuityBadge } from '../components/AcuityBadge'
import { DoctorCriticalPanel } from '../components/ai/DoctorCriticalPanel'
import { useClinic } from '../store/clinicStore'
import type { StaffMember } from '../state/types'
import { getCareLock } from '../utils/careLock'
import { buildPatientBriefing } from '../utils/patientBriefing'
import { distanceFromStaffToRoom, formatDistance } from '../utils/distance'
import { formatTime } from '../utils/ids'

/**
 * Patient detail:
 * - Browse freely until Take care
 * - After Take care → locked to this room; only Update care can release
 */
export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { state, dispatch, viewingStaff, isStaffView, isAdminView } = useClinic()
  const room = state.rooms.find((r) => r.id === id)
  const patient = state.patients.find((p) => p.roomId === id && !p.visitComplete)
  const present = state.staff.filter((s) => s.currentRoomId === id && s.role !== 'admin')

  const doctors = present.filter((s) => s.role === 'doctor')
  const nurses = present.filter((s) => s.role === 'nurse')

  const careLock =
    isStaffView && viewingStaff ? getCareLock(viewingStaff, state.patients) : null

  const operating = useMemo(() => {
    if (!patient || present.length === 0) return null
    for (const h of patient.history) {
      const match = present.find((s) => s.id === h.staffId)
      if (match) return match
    }
    return doctors[0] ?? nurses[0] ?? null
  }, [patient, present, doctors, nurses])

  const briefing = patient ? buildPatientBriefing(patient) : null
  const pendingDirective = patient
    ? state.directives.find(
        (d) =>
          d.patientId === patient.id &&
          d.must &&
          (d.status === 'pending' || d.status === 'accepted'),
      )
    : undefined

  const iAmCaring = Boolean(
    isStaffView && viewingStaff && viewingStaff.currentRoomId === id && patient,
  )
  const lockedElsewhere = Boolean(careLock && careLock.roomId !== id)
  const isDoctorView = isStaffView && viewingStaff?.role === 'doctor'

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

  const roomId = room.id

  function takeCareOfPatient() {
    if (!viewingStaff || viewingStaff.role === 'admin' || !id) return
    if (careLock && careLock.roomId !== id) return
    dispatch({
      type: 'SET_STAFF_LOCATION',
      payload: { staffId: viewingStaff.id, roomId: id },
    })
  }

  function openUpdateCare() {
    if (!id) return
    navigate(`/room/${id}/care`)
  }

  function backToList() {
    // Only allowed when not locked into care
    if (careLock) {
      navigate(`/room/${careLock.roomId}`)
      return
    }
    navigate('/my-dashboard')
  }

  const walkDistance =
    isStaffView && viewingStaff
      ? distanceFromStaffToRoom(viewingStaff, room, state.rooms)
      : null

  const statusLabel =
    room.status === 'occupied'
      ? 'In session'
      : room.status === 'cleaning'
        ? 'Cleaning'
        : 'Ready'

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {iAmCaring && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          <div>
            <p className="font-semibold">You are locked to this patient</p>
            <p className="mt-0.5 text-emerald-800">
              Finish <strong>Update care</strong> (save & leave, or skip) before you can go to
              another room.
            </p>
          </div>
        </div>
      )}

      {lockedElsewhere && careLock && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">
              You are already caring for {careLock.patient.name}
            </p>
            <button
              type="button"
              onClick={() => navigate(`/room/${careLock.roomId}`)}
              className="mt-2 rounded-md bg-amber-800 px-3 py-1.5 text-xs font-medium text-white"
            >
              Return to that patient
            </button>
          </div>
        </div>
      )}

      {patient?.chartIncomplete && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">
            {location.state?.quickUrgentPlaced
              ? 'Patient placed in room — chart can be completed later'
              : 'Intake chart incomplete'}
          </p>
          <p className="mt-0.5 text-amber-800">
            This patient was admitted via Quick urgent. Fill remaining details when you can.
          </p>
          {(isAdminView || !isStaffView) && (
            <Link
              to={`/admin/intake/${patient.id}`}
              className="mt-2 inline-block rounded-md bg-amber-800 px-3 py-1.5 text-xs font-medium text-white"
            >
              Complete chart
            </Link>
          )}
          <Link
            to="/"
            className="ml-2 mt-2 inline-block rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900"
          >
            Watch simulation
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Patient detail · {room.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">
              {patient ? patient.name : 'Empty room'}
            </h1>
            <span
              className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase ${
                room.status === 'occupied'
                  ? 'bg-amber-100 text-amber-800'
                  : room.status === 'cleaning'
                    ? 'bg-slate-200 text-slate-600'
                    : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {statusLabel}
            </span>
            {patient && <AcuityBadge acuity={patient.acuity} />}
            {iAmCaring && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                <Radio className="h-3 w-3" /> You are caring
              </span>
            )}
          </div>
          {walkDistance !== null && !iAmCaring && (
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-sky-700">
              <MapPin className="h-3.5 w-3.5" />
              {formatDistance(walkDistance)} away
            </p>
          )}
        </div>
      </div>

      {(location.state?.arrivedFromMustMove || pendingDirective || patient) && (
        <section className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          {location.state?.arrivedFromMustMove && (
            <p className="font-semibold">Must-move accepted — you are now in the assigned room.</p>
          )}
          {patient && (
            <p className={location.state?.arrivedFromMustMove ? 'mt-1' : ''}>
              Triage: <AcuityBadge acuity={patient.acuity} /> · Care status:{' '}
              <strong>{patient.carePhase.replace(/_/g, ' ')}</strong>
              {operating ? ` · responsible: ${operating.name}` : ''}
              {pendingDirective
                ? ` · ${pendingDirective.status === 'pending' ? 'staff response pending' : 'staff arriving'}`
                : ' · next: review, take care, or update care'}
            </p>
          )}
        </section>
      )}

      {patient && briefing ? (
        <>
          <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-800">
                  <Radio className="h-3.5 w-3.5" />
                  Live room status
                </p>
                <p className="mt-1 text-sm font-semibold text-violet-950">
                  {patient.statusNote ?? 'Patient is being monitored by the care team.'}
                </p>
              </div>
              {patient.statusUpdatedAt && (
                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 font-mono text-[10px] text-violet-700 shadow-sm">
                  <Clock className="h-3 w-3" />
                  {formatTime(patient.statusUpdatedAt)}
                </span>
              )}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                {
                  label: 'Room arrival',
                  done: true,
                  detail: patient.roomId ? room.name : 'Waiting',
                },
                {
                  label: 'Vitals',
                  done: patient.carePhase !== 'awaiting_vitals',
                  detail:
                    patient.carePhase === 'awaiting_vitals'
                      ? 'Waiting for nurse'
                      : patient.vitals.bloodPressure || 'Recorded',
                },
                {
                  label: 'Clinician review',
                  done:
                    patient.simulationStage === 'ready_for_discharge' ||
                    patient.carePhase === 'in_consult' ||
                    patient.carePhase === 'complete',
                  detail:
                    patient.simulationStage === 'ready_for_discharge'
                      ? 'Ready for disposition'
                      : patient.carePhase === 'awaiting_exam'
                      ? 'Ready for assessment'
                      : patient.carePhase === 'in_consult'
                        ? 'In progress'
                        : 'Next step',
                },
              ].map((step) => (
                <div
                  key={step.label}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    step.done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      : 'border-violet-100 bg-white/80 text-slate-600'
                  }`}
                >
                  <p className="font-semibold">{step.done ? '✓ ' : ''}{step.label}</p>
                  <p className="mt-0.5 text-[11px] opacity-80">{step.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            What is going on
          </p>
          <p className="text-base font-medium text-slate-900">{briefing.whatsGoingOn}</p>

          <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Patient condition detail
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            {briefing.conditionDescription}
          </p>

          <ul className="mt-4 flex flex-wrap gap-1.5">
            {briefing.highlights.map((h) => (
              <li
                key={h}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-700"
              >
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
              <p className="text-[11px] uppercase text-slate-400">Vitals</p>
              <p className="mt-1 text-slate-800">
                BP {patient.vitals.bloodPressure || '—'} · HR {patient.vitals.heartRate || '—'}
              </p>
              <p className="text-slate-800">
                RR {patient.vitals.respiratoryRate || '—'} · SpO₂ {patient.vitals.spo2 || '—'}
              </p>
              <p className="text-slate-800">
                Temp {patient.vitals.temperature || '—'} · Wt {patient.vitals.weight || '—'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
              <p className="text-[11px] uppercase text-slate-400">Chart notes</p>
              <p className="mt-1 text-slate-800">{patient.notes?.trim() || 'No notes yet.'}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm sm:col-span-2">
              <p className="text-[11px] uppercase text-slate-400">Intake profile</p>
              <dl className="mt-1 grid gap-1 text-slate-800 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] text-slate-400">Contact</dt>
                  <dd>
                    {patient.phone || '—'}
                    {patient.preferredLanguage ? ` · ${patient.preferredLanguage}` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-400">Emergency</dt>
                  <dd>
                    {patient.emergencyName
                      ? `${patient.emergencyName}${patient.emergencyRelation ? ` (${patient.emergencyRelation})` : ''}${patient.emergencyPhone ? ` · ${patient.emergencyPhone}` : ''}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-400">Allergies</dt>
                  <dd>{patient.allergies?.trim() || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-400">Medications</dt>
                  <dd>{patient.medications?.trim() || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-400">Onset / pain</dt>
                  <dd>
                    {[
                      patient.symptomOnset,
                      patient.symptomDuration,
                      patient.painScore ? `pain ${patient.painScore}/10` : '',
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-400">Arrival</dt>
                  <dd>
                    {[patient.arrivalMode, patient.referringSource].filter(Boolean).join(' · ') ||
                      '—'}
                  </dd>
                </div>
                {patient.pastMedicalHistory?.trim() && (
                  <div className="sm:col-span-2">
                    <dt className="text-[11px] text-slate-400">Past history</dt>
                    <dd>{patient.pastMedicalHistory}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {patient.history.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Recent history
              </p>
              <ul className="space-y-1.5 text-sm text-slate-600">
                {patient.history.slice(0, 4).map((h) => (
                  <li key={h.id}>
                    <span className="font-medium text-slate-800">{h.staffName}</span>
                    {' — '}
                    {h.summary}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {operating && (
            <p className="mt-4 text-xs text-amber-800">
              Currently being seen by <strong>{operating.name}</strong>
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
            {iAmCaring ? (
              <>
                <button
                  type="button"
                  onClick={openUpdateCare}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  <ClipboardEdit className="h-4 w-4" />
                  Update care
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  to={`/room/${roomId}/call`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800"
                >
                  <PhoneCall className="h-4 w-4" />
                  Call staff
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={takeCareOfPatient}
                disabled={
                  !isStaffView ||
                  !viewingStaff ||
                  viewingStaff.role === 'admin' ||
                  lockedElsewhere
                }
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40"
              >
                <HandHelping className="h-4 w-4" />
                Take care of this patient
              </button>
            )}
            {!iAmCaring && !lockedElsewhere && (
              <button
                type="button"
                onClick={backToList}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                See other patients
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {iAmCaring
              ? 'You cannot switch rooms until you finish Update care.'
              : lockedElsewhere
                ? 'Finish your current patient before taking another.'
                : 'Take care locks you to this patient. Then use Update care to finish.'}
          </p>
          </section>
        </>
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <BedDouble className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No active patient in this room.</p>
          {!careLock && (
            <button
              type="button"
              onClick={backToList}
              className="mt-4 text-sm font-medium text-emerald-700 hover:underline"
            >
              See other patients
            </button>
          )}
        </section>
      )}

      {isDoctorView && patient && iAmCaring && <DoctorCriticalPanel patient={patient} />}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <Users className="h-3.5 w-3.5" />
          Who is in this room ({present.length})
        </p>
        <div className="space-y-2">
          {present.length === 0 ? (
            <p className="text-sm text-slate-400">Nobody checked in yet.</p>
          ) : (
            present.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <Avatar staff={s} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {s.name}
                    {viewingStaff?.id === s.id && (
                      <span className="ml-1 text-xs text-emerald-600">(you)</span>
                    )}
                  </p>
                  <p className="truncate text-xs capitalize text-slate-500">
                    {s.role} · {s.specialty}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Avatar({ staff }: { staff: StaffMember }) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
        staff.role === 'doctor' ? 'bg-emerald-600' : 'bg-sky-600'
      }`}
    >
      {initials(staff.name)}
    </div>
  )
}
