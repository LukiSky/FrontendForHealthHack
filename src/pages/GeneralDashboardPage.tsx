import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  BedDouble,
  MapPin,
  Stethoscope,
  User,
  Users,
} from 'lucide-react'
import { useClinic } from '../store/clinicStore'

export function GeneralDashboardPage() {
  const { state } = useClinic()

  const activePatients = state.patients.filter((p) => !p.visitComplete && p.roomId)
  const occupied = state.rooms.filter((r) => r.status === 'occupied').length
  const staffOnFloor = state.staff.filter((s) => s.role !== 'admin' && s.currentRoomId)
  const idleStaff = state.staff.filter((s) => s.role !== 'admin' && !s.currentRoomId)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Viewing as · General (everyone)
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">General Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Shared clinic snapshot. Switch “Viewing as” to Admin or a staff member to open their
          menu.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active patients" value={activePatients.length} icon={Activity} />
        <StatCard
          label="Rooms occupied"
          value={`${occupied}/${state.rooms.length}`}
          icon={BedDouble}
        />
        <StatCard label="Staff in rooms" value={staffOnFloor.length} icon={MapPin} />
        <StatCard label="Staff available" value={idleStaff.length} icon={Users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Rooms at a glance</h2>
            <Link to="/rooms" className="text-xs font-medium text-emerald-700 hover:underline">
              Full room list →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {state.rooms.slice(0, 8).map((room) => {
              const patient = state.patients.find(
                (p) => p.roomId === room.id && !p.visitComplete,
              )
              const present = state.staff.filter((s) => s.currentRoomId === room.id)
              return (
                <Link
                  key={room.id}
                  to={`/room/${room.id}`}
                  className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">{room.name}</span>
                    <span className="text-[10px] uppercase text-slate-500">{room.status}</span>
                  </div>
                  <p className="truncate text-xs text-slate-600">
                    {patient ? patient.name : 'Empty'}
                    {present.length > 0 ? ` · ${present.length} staff` : ''}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Who is where</h2>
          <ul className="space-y-2">
            {staffOnFloor.length === 0 ? (
              <li className="text-sm text-slate-400">No clinicians currently in a room.</li>
            ) : (
              staffOnFloor.map((s) => {
                const room = state.rooms.find((r) => r.id === s.currentRoomId)
                return (
                  <li key={s.id}>
                    <Link
                      to={`/room/${s.currentRoomId}`}
                      className="flex items-center gap-2 rounded-md border border-slate-100 px-2.5 py-2 text-sm hover:bg-slate-50"
                    >
                      {s.role === 'doctor' ? (
                        <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-sky-600" />
                      )}
                      <span className="font-medium text-slate-800">{s.name}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-slate-600">{room?.name}</span>
                    </Link>
                  </li>
                )
              })
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  )
}
