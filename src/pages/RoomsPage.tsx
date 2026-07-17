import { Link, useLocation } from 'react-router-dom'
import { BedDouble, Bot, MapPin, Radio, Stethoscope, User } from 'lucide-react'
import { AcuityBadge } from '../components/AcuityBadge'
import { useClinic } from '../store/clinicStore'
import { formatTime } from '../utils/ids'

export function RoomsPage() {
  const { state, isAiView } = useClinic()
  const location = useLocation()
  const notify = location.state as
    | { aiNotified?: boolean; patientName?: string; roomId?: string }
    | null

  const staffOnFloor = state.staff.filter(
    (s) => s.role !== 'admin' && s.currentRoomId,
  )
  const pending = state.directives.filter((d) => d.status === 'pending')

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          {isAiView ? 'Viewing as · Demo Agent' : 'Clinic overview'}
        </p>
        <h1 className="text-xl font-semibold text-slate-900">
          {isAiView ? 'Demo Agent — live thoughts' : 'Rooms & Demo Dispatch'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Live rooms and Demo Agent thoughts. The agent assigns waiting patients to free rooms;
          clinician location changes appear after care actions or critical must-moves.
        </p>
      </div>

      <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
        <span className="font-semibold">Demo routing logic</span> — highest-acuity waiting
        patient goes to the closest free room. Staff only move for care actions or must-moves.
      </div>

      {notify?.aiNotified && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span className="font-semibold">Demo Agent notified</span> — observing{' '}
          {notify.patientName ?? 'new patient'}. Waiting patients are assigned to free rooms;
          a doctor can issue a critical must-move from the Live Room View.
          {notify.roomId && (
            <>
              {' '}
              <Link
                to={`/room/${notify.roomId}`}
                className="font-medium underline hover:no-underline"
              >
                Open room →
              </Link>
            </>
          )}
        </div>
      )}

      {isAiView && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          <span className="font-semibold">Observer mode:</span> watching Demo Agent thoughts.
          Switch to a Doctor to issue critical must-moves or report wrong-room mistakes.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Live staff locations
            </h2>
            <div className="flex flex-wrap gap-2">
              {staffOnFloor.length === 0 ? (
                <p className="text-sm text-slate-400">No clinicians currently in a room.</p>
              ) : (
                staffOnFloor.map((s) => {
                  const room = state.rooms.find((r) => r.id === s.currentRoomId)
                  const task = state.directives.find((d) => d.id === s.currentTaskId)
                  return (
                    <Link
                      key={s.id}
                      to={`/staff/${s.id}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      {s.role === 'doctor' ? (
                        <Stethoscope className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <User className="h-3 w-3 text-sky-600" />
                      )}
                      <span className="font-medium">{s.name}</span>
                      <span className="text-slate-400">in</span>
                      <span>{room?.name ?? s.currentRoomId}</span>
                      {task && (task.status === 'pending' || task.status === 'accepted') && (
                        <span className="rounded bg-violet-100 px-1 text-[10px] text-violet-800">
                          AI task
                        </span>
                      )}
                    </Link>
                  )
                })
              )}
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {state.rooms.map((room) => {
              const patient = state.patients.find(
                (p) => p.roomId === room.id && !p.visitComplete,
              )
              const present = state.staff.filter((s) => s.currentRoomId === room.id)
              return (
                <Link
                  key={room.id}
                  to={`/room/${room.id}`}
                  className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-slate-500" />
                      <h3 className="font-semibold text-slate-900">{room.name}</h3>
                    </div>
                    <StatusBadge status={room.status} />
                  </div>
                  {patient ? (
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{patient.name}</span>
                      <span className="block text-xs text-slate-500">
                        <AcuityBadge acuity={patient.acuity} />{' '}
                        <span className="ml-1">{patient.reason} · </span>
                        {patient.carePhase.replace(/_/g, ' ')}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">No active patient</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {present.length === 0 ? (
                      <span className="text-[11px] text-slate-400">No staff present</span>
                    ) : (
                      present.map((s) => (
                        <span
                          key={s.id}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
                        >
                          {s.name}
                        </span>
                      ))
                    )}
                  </div>
                  <p className="mt-3 text-xs font-medium text-emerald-700 opacity-80 group-hover:opacity-100">
                    Enter room →
                  </p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* AI Dispatch Feed */}
        <aside className="flex min-h-[420px] flex-col gap-3">
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-violet-800 bg-slate-950 shadow-sm">
            <div className="flex items-center gap-2 border-b border-violet-900/60 px-4 py-2.5">
              <Bot className="h-4 w-4 text-violet-300" />
              <h2 className="text-sm font-semibold text-slate-100">Demo Dispatch Feed</h2>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
                <Radio className="h-3 w-3" /> live
              </span>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 font-mono text-[11px] leading-relaxed">
              {state.aiThoughts.length === 0 ? (
                <p className="text-slate-500">No Demo Agent thoughts yet…</p>
              ) : (
                state.aiThoughts.map((t) => (
                  <div key={t.id} className="border-b border-slate-800/80 pb-2">
                    <span className="text-slate-500">[{formatTime(t.at)}]</span>{' '}
                    <span className="text-violet-300">DEMO</span>{' '}
                    <span className="text-slate-200">{t.message}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">
              Critical must-moves (pending)
            </h2>
            {pending.filter((d) => d.must).length === 0 ? (
              <p className="text-sm text-slate-400">
                None. Doctors issue these from Live Room View.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {pending
                  .filter((d) => d.must)
                  .map((d) => {
                  const staff = state.staff.find((s) => s.id === d.staffId)
                  const room = state.rooms.find((r) => r.id === d.roomId)
                  return (
                    <li
                      key={d.id}
                      className="rounded-md border border-red-100 bg-red-50 px-2.5 py-2"
                    >
                      <p className="font-medium text-red-950">{d.title}</p>
                      <p className="text-xs text-red-800">
                        → {staff?.name} · {room?.name} · MUST
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === 'occupied'
      ? 'bg-amber-100 text-amber-800'
      : status === 'cleaning'
        ? 'bg-slate-200 text-slate-600'
        : 'bg-emerald-100 text-emerald-800'
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${styles}`}>
      {status}
    </span>
  )
}
