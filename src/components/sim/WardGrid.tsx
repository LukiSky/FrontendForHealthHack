import { Bed, Stethoscope, User } from 'lucide-react'
import type { Patient, Room, SimulationState, StaffMember } from '../../state/types'

interface WardGridProps {
  state: SimulationState
}

export function WardGrid({ state }: WardGridProps) {
  const byLevel = {
    1: state.rooms.filter((r) => r.level === 1),
    2: state.rooms.filter((r) => r.level === 2),
    3: state.rooms.filter((r) => r.level === 3),
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Bed className="h-4 w-4 text-slate-600" />
        <h2 className="text-sm font-semibold text-slate-800">Ward Grid</h2>
        <span className="ml-auto text-xs text-slate-400">30 rooms</span>
      </div>

      <div className="space-y-3 p-3">
        {([1, 2, 3] as const).map((level) => (
          <div key={level}>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Level {level}{' '}
              {level === 1 ? 'Critical' : level === 2 ? 'Urgent' : 'Standard'}
            </p>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
              {byLevel[level].map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  patient={state.patients.find((p) => p.id === room.patientId) ?? null}
                  staff={state.staffMembers.find((s) => s.id === room.staffId) ?? null}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function RoomCard({
  room,
  patient,
  staff,
}: {
  room: Room
  patient: Patient | null
  staff: StaffMember | null
}) {
  const occupied = Boolean(patient)
  const crashed = Boolean(patient?.crashed)

  return (
    <div
      className={`relative flex min-h-[64px] flex-col rounded border p-1.5 text-[10px] transition-colors ${
        crashed
          ? 'crash-flash text-red-950'
          : occupied
            ? 'border-slate-300 bg-slate-100 text-slate-800'
            : 'border-slate-200 bg-slate-50 text-slate-400'
      }`}
      title={
        occupied
          ? `${room.id}: ${patient?.name} (L${patient?.triageLevel})${staff ? ` · ${staff.name}` : ' · unstaffed'}`
          : `${room.id}: empty`
      }
    >
      <div className="flex items-center justify-between gap-0.5">
        <span className="font-mono font-semibold leading-none">{room.id.replace(/^L\d-/, '')}</span>
        {staff ? (
          staff.role === 'doctor' ? (
            <Stethoscope className="h-3 w-3 shrink-0 text-emerald-600" />
          ) : (
            <User className="h-3 w-3 shrink-0 text-sky-600" />
          )
        ) : occupied ? (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        ) : null}
      </div>
      {occupied ? (
        <>
          <span className="mt-0.5 truncate font-medium leading-tight">{patient?.id}</span>
          <span className="truncate text-[9px] opacity-80">L{patient?.triageLevel}</span>
        </>
      ) : (
        <span className="mt-1 flex items-center gap-0.5 opacity-60">
          <Bed className="h-3 w-3" /> empty
        </span>
      )}
    </div>
  )
}
