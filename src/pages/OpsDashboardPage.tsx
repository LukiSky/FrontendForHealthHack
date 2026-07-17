import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  BedDouble,
  ClipboardList,
  MapPin,
  UserPlus,
  Users,
} from 'lucide-react'
import { useClinic } from '../store/clinicStore'

/** Shared clinic ops hub: KPIs + patients-by-room table + staff table */
export function OpsDashboardPage() {
  const { state, isAdminView, isGeneralView } = useClinic()

  const activePatients = state.patients
    .filter((p) => !p.visitComplete && p.roomId)
    .slice()
    .sort((a, b) => {
      const roomA = state.rooms.find((r) => r.id === a.roomId)?.name ?? ''
      const roomB = state.rooms.find((r) => r.id === b.roomId)?.name ?? ''
      return roomA.localeCompare(roomB)
    })

  const clinicians = state.staff.filter((s) => s.role !== 'admin')
  const availableRooms = state.rooms.filter((r) => r.status === 'available')
  const occupiedRooms = state.rooms.filter((r) => r.status === 'occupied')
  const staffInRooms = clinicians.filter((s) => s.currentRoomId)
  const recent = state.activity.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {isAdminView
              ? 'Admin · Clinic ops'
              : isGeneralView
                ? 'General · Clinic ops'
                : 'Clinic ops'}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Clinic ops</h1>
          <p className="mt-1 text-sm text-slate-500">
            Patients by room and staff roster in one place.
            {!isAdminView && (
              <span className="ml-1 text-amber-700">
                Tip: switch Viewing as to Admin for Intake.
              </span>
            )}
          </p>
        </div>
        <Link
          to="/admin/intake"
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          <UserPlus className="h-4 w-4" />
          Intake
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active patients" value={activePatients.length} icon={Activity} />
        <StatCard
          label="Rooms free / occupied"
          value={`${availableRooms.length} / ${occupiedRooms.length}`}
          icon={BedDouble}
        />
        <StatCard label="Staff in rooms" value={staffInRooms.length} icon={MapPin} />
        <StatCard
          label="Staff available"
          value={clinicians.length - staffInRooms.length}
          icon={Users}
        />
      </div>

      <section id="patients" className="scroll-mt-20 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Patients by room</h2>
          <Link to="/rooms" className="text-xs font-medium text-emerald-700 hover:underline">
            Rooms floor →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Room</th>
                <th className="px-4 py-2 font-semibold">Patient</th>
                <th className="px-4 py-2 font-semibold">Acuity</th>
                <th className="px-4 py-2 font-semibold">Phase</th>
                <th className="px-4 py-2 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activePatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No active patients in rooms.
                  </td>
                </tr>
              ) : (
                activePatients.map((p) => {
                  const room = state.rooms.find((r) => r.id === p.roomId)
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        {room ? (
                          <Link
                            to={`/room/${room.id}`}
                            className="font-medium text-emerald-700 hover:underline"
                          >
                            {room.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-400">
                          {p.id} · age {p.age}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-semibold capitalize ${
                            p.acuity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : p.acuity === 'urgent'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {p.acuity}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 capitalize text-slate-600">
                        {p.carePhase.replace(/_/g, ' ')}
                      </td>
                      <td className="max-w-xs truncate px-4 py-2.5 text-slate-600">
                        {p.reason}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section id="staff" className="scroll-mt-20 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Staff</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Role</th>
                <th className="px-4 py-2 font-semibold">Specialty</th>
                <th className="px-4 py-2 font-semibold">Location</th>
                <th className="px-4 py-2 font-semibold">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clinicians.map((s) => {
                const room = state.rooms.find((r) => r.id === s.currentRoomId)
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/staff/${s.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {s.name}
                      </Link>
                      <p className="text-xs text-slate-400">{s.id}</p>
                    </td>
                    <td className="px-4 py-2.5 capitalize text-slate-700">{s.role}</td>
                    <td className="px-4 py-2.5 text-slate-600">{s.specialty}</td>
                    <td className="px-4 py-2.5">
                      {room ? (
                        <Link
                          to={`/room/${room.id}`}
                          className="text-slate-800 hover:text-emerald-700 hover:underline"
                        >
                          {room.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">Station</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{s.contact}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <ClipboardList className="h-4 w-4 text-slate-500" />
          Recent activity
        </h2>
        <ul className="space-y-2 text-sm">
          {recent.length === 0 ? (
            <li className="text-slate-400">No activity yet.</li>
          ) : (
            recent.map((a) => (
              <li key={a.id} className="text-slate-600">
                <span className="font-medium text-slate-800">{a.patientName}</span>
                {' — '}
                {a.action}
              </li>
            ))
          )}
        </ul>
      </section>
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
