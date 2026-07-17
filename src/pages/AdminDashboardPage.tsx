import { Link } from 'react-router-dom'
import { BedDouble, ClipboardList, UserPlus, Users } from 'lucide-react'
import { useClinic } from '../store/clinicStore'

export function AdminDashboardPage() {
  const { state, isAdminView } = useClinic()

  const activePatients = state.patients.filter((p) => !p.visitComplete && p.roomId)
  const availableRooms = state.rooms.filter((r) => r.status === 'available')
  const recent = state.activity.slice(0, 6)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Viewing as · Admin
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Room census and clinic operations. Use the Intake tab for new patients.
          {!isAdminView && (
            <span className="ml-1 text-amber-700">
              Tip: switch “Viewing as” to Admin to use the Admin menu.
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5" /> Active patients
          </p>
          <p className="mt-1 text-2xl font-semibold">{activePatients.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <BedDouble className="h-3.5 w-3.5" /> Rooms free
          </p>
          <p className="mt-1 text-2xl font-semibold">{availableRooms.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <ClipboardList className="h-3.5 w-3.5" /> Recent admits / updates
          </p>
          <p className="mt-1 text-2xl font-semibold">{recent.length}</p>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-emerald-950">
            <UserPlus className="h-4 w-4 text-emerald-700" />
            <span>Admit a new patient from the Intake page.</span>
          </div>
          <Link
            to="/admin/intake"
            className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Go to Intake
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Room census</h2>
          <ul className="max-h-80 space-y-1.5 overflow-y-auto text-sm">
            {state.rooms.map((room) => {
              const patient = state.patients.find(
                (p) => p.roomId === room.id && !p.visitComplete,
              )
              return (
                <li key={room.id}>
                  <Link
                    to={`/room/${room.id}`}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-800">{room.name}</span>
                    <span className="truncate text-xs text-slate-500">
                      {patient?.name ?? room.status}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Recent activity</h2>
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
    </div>
  )
}
