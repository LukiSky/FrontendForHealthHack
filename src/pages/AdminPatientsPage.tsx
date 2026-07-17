import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BedDouble, Clock } from 'lucide-react'
import { AcuityBadge } from '../components/AcuityBadge'
import { useClinic } from '../store/clinicStore'
import { formatTime } from '../utils/ids'

/** Waiting list + in-room patients for admin */
export function AdminPatientsPage() {
  const { state, dispatch, isAdminView } = useClinic()
  const [assignRoomByPatient, setAssignRoomByPatient] = useState<Record<string, string>>(
    {},
  )

  const waiting = state.patients
    .filter((p) => !p.visitComplete && !p.roomId)
    .sort((a, b) => {
      const rank = { critical: 3, urgent: 2, routine: 1 }
      return rank[b.acuity] - rank[a.acuity]
    })

  const inRooms = state.patients
    .filter((p) => !p.visitComplete && p.roomId)
    .sort((a, b) => {
      const ra = state.rooms.find((r) => r.id === a.roomId)?.name ?? ''
      const rb = state.rooms.find((r) => r.id === b.roomId)?.name ?? ''
      return ra.localeCompare(rb)
    })

  const freeRooms = state.rooms.filter(
    (r) =>
      r.status !== 'cleaning' &&
      !state.patients.some((p) => p.roomId === r.id && !p.visitComplete),
  )

  function assign(patientId: string) {
    if (!isAdminView) return
    const roomId =
      assignRoomByPatient[patientId] ?? freeRooms[0]?.id
    if (!roomId) return
    dispatch({
      type: 'MOVE_PATIENT',
      payload: { patientId, roomId, by: 'admin', note: 'Admin assigned from Patients page' },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Admin · Patients
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Patients</h1>
        <p className="mt-1 text-sm text-slate-500">
          Waiting list and patients already in rooms. Demo Agent assigns waiting patients to
          free rooms unless paused on Demo Live.
          {!isAdminView && (
            <span className="ml-1 text-amber-700">Switch Viewing as to Admin for overrides.</span>
          )}
        </p>
        <p
          className={`mt-2 text-xs font-medium ${
            state.agentAssignEnabled !== false ? 'text-emerald-700' : 'text-amber-700'
          }`}
        >
          Demo Agent assignment: {state.agentAssignEnabled !== false ? 'on' : 'paused'} ·{' '}
          <Link to="/admin/demo" className="underline">
            manage on Demo Live
          </Link>
        </p>
      </div>

      <section className="rounded-lg border border-amber-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3">
          <Clock className="h-4 w-4 text-amber-700" />
          <h2 className="text-sm font-semibold text-amber-950">
            Waiting list ({waiting.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Patient</th>
                <th className="px-4 py-2">Acuity</th>
                <th className="px-4 py-2">Reason</th>
                <th className="px-4 py-2">Allergies</th>
                <th className="px-4 py-2">Admitted</th>
                <th className="px-4 py-2">Assign room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waiting.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No one waiting. Agent will assign here when Intake adds patients without a
                    room.
                  </td>
                </tr>
              ) : (
                waiting.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.id}</p>
                      {p.chartIncomplete && (
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                            Chart incomplete
                          </span>
                          <Link
                            to={`/admin/intake/${p.id}`}
                            className="text-[11px] font-medium text-amber-800 underline"
                          >
                            Complete chart
                          </Link>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <AcuityBadge acuity={p.acuity} />
                    </td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-slate-600">{p.reason}</td>
                    <td className="max-w-[8rem] truncate px-4 py-2.5 text-xs text-slate-600">
                      {p.allergies?.trim() || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {formatTime(p.admittedAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={assignRoomByPatient[p.id] ?? freeRooms[0]?.id ?? ''}
                          onChange={(e) =>
                            setAssignRoomByPatient((m) => ({
                              ...m,
                              [p.id]: e.target.value,
                            }))
                          }
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                          disabled={!isAdminView || freeRooms.length === 0}
                        >
                          {freeRooms.length === 0 ? (
                            <option value="">No free rooms</option>
                          ) : (
                            freeRooms.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          type="button"
                          disabled={!isAdminView || freeRooms.length === 0}
                          onClick={() => assign(p.id)}
                          className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40"
                        >
                          Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <BedDouble className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">
            In rooms ({inRooms.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Room</th>
                <th className="px-4 py-2">Patient</th>
                <th className="px-4 py-2">Acuity</th>
                <th className="px-4 py-2">Phase</th>
                <th className="px-4 py-2">Reason</th>
                <th className="px-4 py-2">Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inRooms.map((p) => {
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
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{p.name}</td>
                    <td className="px-4 py-2.5">
                      <AcuityBadge acuity={p.acuity} />
                    </td>
                    <td className="px-4 py-2.5 capitalize text-slate-600">
                      {p.carePhase.replace(/_/g, ' ')}
                    </td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-slate-600">{p.reason}</td>
                    <td className="px-4 py-2.5">
                      {p.chartIncomplete ? (
                        <Link
                          to={`/admin/intake/${p.id}`}
                          className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 hover:underline"
                        >
                          Incomplete · finish
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">Complete</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
