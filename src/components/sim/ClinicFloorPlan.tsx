import { Link } from 'react-router-dom'
import { BedDouble, Stethoscope, UserRound } from 'lucide-react'
import { AcuityBadge } from '../AcuityBadge'
import type { Patient, Room, StaffMember } from '../../state/types'

type ClinicFloorPlanProps = {
  rooms: Room[]
  patients: Patient[]
  staff: StaffMember[]
  compact?: boolean
  showWaitingBay?: boolean
  highlightPatientId?: string
}

function phaseLabel(patient: Patient): string {
  if (patient.simulationStage === 'ready_for_discharge') return 'Ready for disposition'
  if (patient.simulationStage === 'awaiting_exam') return 'Awaiting exam'
  if (patient.simulationStage === 'vitals_recorded') return 'Triage review'
  if (patient.simulationStage === 'roomed') return 'Awaiting vitals'
  return patient.carePhase.replace(/_/g, ' ')
}

function roomClass(room: Room, patient?: Patient): string {
  if (room.status === 'cleaning') return 'border-slate-300 bg-slate-100'
  if (!patient) return 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-400'
  if (patient.acuity === 'critical') return 'border-rose-300 bg-rose-50 hover:border-rose-500'
  if (patient.acuity === 'urgent') return 'border-amber-300 bg-amber-50 hover:border-amber-500'
  return 'border-sky-300 bg-sky-50 hover:border-sky-500'
}

/** Readable shared floor board. State changes animate only when actual room/staff state changes. */
export function ClinicFloorPlan({
  rooms,
  patients,
  staff,
  compact = false,
  showWaitingBay = true,
  highlightPatientId,
}: ClinicFloorPlanProps) {
  const activePatients = patients.filter((patient) => !patient.visitComplete)
  const waiting = activePatients.filter((patient) => !patient.roomId)
  const patientByRoom = new Map(
    activePatients.filter((patient) => patient.roomId).map((patient) => [patient.roomId!, patient]),
  )
  const clinicians = staff.filter((member) => member.role !== 'admin')

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-900">Live floor board</h2>
        </div>
        <span className="text-xs text-slate-500">
          {activePatients.length} active patient{activePatients.length === 1 ? '' : 's'} ·{' '}
          {clinicians.filter((member) => member.currentRoomId).length} clinician
          {clinicians.filter((member) => member.currentRoomId).length === 1 ? '' : 's'} in rooms
        </span>
      </div>

      {showWaitingBay && (
        <div className="mb-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">
            Waiting bay · {waiting.length}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {waiting.length === 0 ? (
              <span className="text-xs text-amber-800/70">No patients waiting</span>
            ) : (
              waiting.map((patient) => (
                <span
                  key={patient.id}
                  className={`inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm ${
                    highlightPatientId === patient.id ? 'ring-2 ring-amber-400' : ''
                  }`}
                >
                  {patient.name}
                  <AcuityBadge acuity={patient.acuity} compact />
                </span>
              ))
            )}
          </div>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2 rounded-lg border border-violet-100 bg-violet-50/60 p-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-800">
          Clinician movement
        </span>
        {clinicians.filter((member) => member.currentRoomId).length === 0 ? (
          <span className="text-xs text-violet-700/70">All clinicians are at the station</span>
        ) : (
          clinicians
            .filter((member) => member.currentRoomId)
            .map((member) => (
              <span
                key={member.id}
                className="animate-pulse rounded bg-white px-2 py-1 text-[11px] font-medium text-violet-950 shadow-sm transition-all duration-700"
              >
                {member.name} → {rooms.find((room) => room.id === member.currentRoomId)?.name}
              </span>
            ))
        )}
      </div>

      <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6'}`}>
        {rooms.map((room) => {
          const patient = patientByRoom.get(room.id)
          const present = clinicians.filter((member) => member.currentRoomId === room.id)
          return (
            <Link
              key={room.id}
              to={`/room/${room.id}`}
              className={`min-h-28 rounded-lg border p-2 transition-all duration-500 ${roomClass(room, patient)} ${
                patient?.id === highlightPatientId ? 'ring-2 ring-violet-500 ring-offset-1' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-[11px] font-bold text-slate-700">{room.name}</span>
                {patient && <AcuityBadge acuity={patient.acuity} compact />}
              </div>
              {patient ? (
                <>
                  <p className="mt-2 truncate text-xs font-semibold text-slate-900">{patient.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-600">{phaseLabel(patient)}</p>
                </>
              ) : (
                <p className="mt-3 text-xs text-slate-400">
                  {room.status === 'cleaning' ? 'Cleaning' : 'Available'}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {present.map((member) => (
                  <span
                    key={member.id}
                    className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium ${
                      member.role === 'doctor'
                        ? 'bg-violet-100 text-violet-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {member.role === 'doctor' ? <Stethoscope className="h-2.5 w-2.5" /> : <UserRound className="h-2.5 w-2.5" />}
                    {member.name.replace('Dr. ', '')}
                  </span>
                ))}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
