import { Link } from 'react-router-dom'
import {
  BedDouble,
  DoorOpen,
  MapPin,
  Stethoscope,
  User,
} from 'lucide-react'
import { AiDirectivePanel } from '../components/ai/AiDirectivePanel'
import { useClinic } from '../store/clinicStore'

export function StaffMovePage() {
  const { state, viewingStaff, isStaffView, setViewingAs } = useClinic()

  const clinicians = state.staff.filter((s) => s.role !== 'admin')
  const actor = isStaffView && viewingStaff?.role !== 'admin' ? viewingStaff : null

  const myMust = actor
    ? state.directives.filter(
        (d) =>
          d.staffId === actor.id &&
          d.must &&
          (d.status === 'pending' || d.status === 'accepted'),
      )
    : []

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
          Viewing as · Staff · Where to go
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Where to go</h1>
        <p className="mt-1 text-sm text-slate-500">
          No free-for-all &quot;Move here&quot;. Enter a room to view it, or Accept a{' '}
          <strong>doctor critical must-move</strong>. Use &quot;I&apos;m here&quot; inside a
          room to check in.
        </p>
      </div>

      {!actor ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Pick a Doctor or Nurse identity to see your must-moves.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {clinicians.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setViewingAs(s.id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm text-slate-800 hover:bg-amber-100"
              >
                {s.role === 'doctor' ? (
                  <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <User className="h-3.5 w-3.5 text-sky-600" />
                )}
                {s.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <DoorOpen className="h-4 w-4 text-emerald-700" />
              <span className="text-slate-600">Acting as</span>
              <span className="font-semibold text-slate-900">{actor.name}</span>
              <span className="text-slate-500">
                · currently{' '}
                {actor.currentRoomId
                  ? state.rooms.find((r) => r.id === actor.currentRoomId)?.name
                  : 'not in a room'}
              </span>
            </div>
          </div>

          <AiDirectivePanel staffId={actor.id} />

          {myMust.length > 0 && (
            <p className="text-sm text-red-800">
              You have {myMust.length} critical must-move
              {myMust.length > 1 ? 's' : ''}. Accept above to update your location.
            </p>
          )}
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {state.rooms.map((room) => {
          const patient = state.patients.find(
            (p) => p.roomId === room.id && !p.visitComplete,
          )
          const present = state.staff.filter(
            (s) => s.currentRoomId === room.id && s.role !== 'admin',
          )
          const iAmHere = actor?.currentRoomId === room.id
          const mustForHere = myMust.find((d) => d.roomId === room.id)

          return (
            <div
              key={room.id}
              className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm ${
                mustForHere
                  ? 'border-red-400 ring-2 ring-red-200'
                  : iAmHere
                    ? 'border-emerald-500 ring-2 ring-emerald-200'
                    : 'border-slate-200'
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-slate-500" />
                  <h2 className="font-semibold text-slate-900">{room.name}</h2>
                </div>
                {mustForHere && (
                  <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    MUST
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-700">
                {patient ? (
                  <>
                    <span className="font-medium">{patient.name}</span>
                    <span className="block text-xs text-slate-500">
                      {patient.acuity} · {patient.reason}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400">No patient</span>
                )}
              </p>

              <div className="mt-3 min-h-[2.5rem]">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Who&apos;s inside
                </p>
                {present.length === 0 ? (
                  <p className="text-xs text-slate-400">Empty</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {present.map((s) => (
                      <span
                        key={s.id}
                        className={`rounded px-1.5 py-0.5 text-[11px] ${
                          s.id === actor?.id
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4">
                <Link
                  to={`/room/${room.id}`}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-slate-900 px-2 py-2 text-xs font-medium text-white hover:bg-slate-800"
                >
                  <MapPin className="h-3 w-3" />
                  {iAmHere ? 'Open room (you are here)' : 'Enter room'}
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
