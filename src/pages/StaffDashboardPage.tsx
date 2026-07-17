import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin } from 'lucide-react'
import { AiDirectivePanel } from '../components/ai/AiDirectivePanel'
import { useClinic } from '../store/clinicStore'
import { formatTime } from '../utils/ids'

export function StaffDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const { state, dispatch, viewingStaff } = useClinic()
  const staff = state.staff.find((s) => s.id === id)

  if (!staff || staff.role === 'admin') {
    return (
      <div className="space-y-3">
        <p className="text-slate-600">Staff member not found.</p>
        <Link to="/staff" className="text-sm text-emerald-700 hover:underline">
          Back to directory
        </Link>
      </div>
    )
  }

  const currentRoom = state.rooms.find((r) => r.id === staff.currentRoomId)
  const isSelf = viewingStaff?.id === staff.id
  const todayHistory = state.activity.filter((a) => a.staffId === staff.id)

  function updateLocation(roomId: string) {
    dispatch({
      type: 'SET_STAFF_LOCATION',
      payload: {
        staffId: staff!.id,
        roomId: roomId === '' ? null : roomId,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          to="/staff"
          className="mb-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3 w-3" /> Directory
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">{staff.name}</h1>
        <p className="text-sm capitalize text-slate-500">
          {staff.role} · {staff.specialty} · {staff.id}
        </p>
      </div>

      <AiDirectivePanel staffId={staff.id} />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Profile</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-400">Contact</dt>
                <dd className="text-slate-800">{staff.contact}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Specialty / role</dt>
                <dd className="text-slate-800">{staff.specialty}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Clock className="h-4 w-4" /> Today&apos;s schedule
            </h2>
            <ul className="space-y-2">
              {staff.schedule.map((slot) => (
                <li
                  key={slot.time + slot.label}
                  className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-slate-500">{slot.time}</span>
                  <span className="text-slate-800">{slot.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              Patients treated / updated today
            </h2>
            {todayHistory.length === 0 ? (
              <p className="text-sm text-slate-400">No activity logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {todayHistory.map((a) => (
                  <li key={a.id} className="text-sm text-slate-700">
                    <span className="font-mono text-xs text-slate-400">
                      {formatTime(a.at)}
                    </span>{' '}
                    <span className="font-medium">{a.patientName}</span> — {a.action}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <MapPin className="h-4 w-4 text-emerald-600" />
            Current location
          </h2>
          <p className="mb-3 text-sm text-slate-700">
            {currentRoom ? (
              <>
                In{' '}
                <Link
                  to={`/room/${currentRoom.id}`}
                  className="font-medium text-emerald-700 hover:underline"
                >
                  {currentRoom.name}
                </Link>
              </>
            ) : (
              'Not currently assigned to a room.'
            )}
          </p>

          <label className="block text-xs font-medium text-slate-600">
            {isSelf ? 'Change my location' : 'Update location (demo)'}
            <select
              value={staff.currentRoomId ?? ''}
              onChange={(e) => updateLocation(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
            >
              <option value="">Not in a room</option>
              {state.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-[11px] text-slate-400">
            Or use Accept on an AI directive to move automatically.
          </p>
        </section>
      </div>
    </div>
  )
}
