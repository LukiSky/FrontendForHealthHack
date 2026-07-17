import { Link } from 'react-router-dom'
import { Bot, MapPin, Stethoscope, User } from 'lucide-react'
import { useClinic } from '../store/clinicStore'

export function StaffDirectoryPage() {
  const { state } = useClinic()
  const clinicians = state.staff.filter((s) => s.role !== 'admin')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Staff Directory</h1>
        <p className="text-sm text-slate-500">
          Doctors and nurses with live location and AI-assigned tasks.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clinicians.map((s) => {
          const room = state.rooms.find((r) => r.id === s.currentRoomId)
          const task = state.directives.find(
            (d) =>
              d.id === s.currentTaskId &&
              d.must &&
              (d.status === 'pending' || d.status === 'accepted'),
          )
          return (
            <Link
              key={s.id}
              to={`/staff/${s.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-2">
                {s.role === 'doctor' ? (
                  <Stethoscope className="h-5 w-5 text-emerald-600" />
                ) : (
                  <User className="h-5 w-5 text-sky-600" />
                )}
                <div>
                  <h2 className="font-semibold text-slate-900">{s.name}</h2>
                  <p className="text-xs capitalize text-slate-500">
                    {s.role} · {s.specialty}
                  </p>
                </div>
              </div>
              <dl className="space-y-1 text-sm text-slate-600">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Staff ID</dt>
                  <dd className="font-mono text-xs">{s.id}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Contact</dt>
                  <dd className="truncate text-xs">{s.contact}</dd>
                </div>
                <div className="mt-2 flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1.5 text-xs">
                  <MapPin className="h-3 w-3 text-emerald-600" />
                  <span className="font-medium text-slate-700">
                    {room ? room.name : 'Not in a room'}
                  </span>
                </div>
                {task ? (
                  <div className="mt-1 flex items-start gap-1.5 rounded-md bg-violet-50 px-2 py-1.5 text-xs text-violet-900">
                    <Bot className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>
                      <span className="font-semibold">
                        {task.must
                          ? task.status === 'pending'
                            ? 'MUST pending: '
                            : 'MUST active: '
                          : task.status === 'pending'
                            ? 'Task: '
                            : 'Task: '}
                      </span>
                      {task.title}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-slate-400">No critical must-move</div>
                )}
              </dl>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
