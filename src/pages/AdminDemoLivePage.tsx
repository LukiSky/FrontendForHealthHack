import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Circle, FastForward, Pause, Play, RotateCcw, Siren, Sparkles } from 'lucide-react'
import { planAiTick } from '../agents/aiManager'
import { ClinicFloorPlan } from '../components/sim/ClinicFloorPlan'
import { SimClockBar } from '../components/sim/SimClockBar'
import { SimLiveFeeds } from '../components/sim/SimLiveFeeds'
import { useClinic } from '../store/clinicStore'

/** Admin simulation theater: shared floor plan + feeds + override controls */
export function AdminDemoLivePage() {
  const { state, dispatch, isAdminView, setViewingAs } = useClinic()
  const navigate = useNavigate()
  const [waitPatientId, setWaitPatientId] = useState('')
  const [waitRoomId, setWaitRoomId] = useState('')
  const [reassignPatientId, setReassignPatientId] = useState('')
  const [reassignRoomId, setReassignRoomId] = useState('')
  const [forceStaffId, setForceStaffId] = useState('')
  const [forceRoomId, setForceRoomId] = useState('')

  const waiting = state.patients.filter((p) => !p.visitComplete && !p.roomId)
  const freeRooms = state.rooms.filter(
    (r) =>
      r.status !== 'cleaning' &&
      !state.patients.some((p) => p.roomId === r.id && !p.visitComplete),
  )
  const clinicians = state.staff.filter((s) => s.role !== 'admin')
  const assignEnabled = state.agentAssignEnabled !== false
  const incompleteCharts = state.patients.filter(
    (p) => !p.visitComplete && p.chartIncomplete,
  )

  const checklist = useMemo(() => {
    const assigned = state.activity.some(
      (a) => a.action.includes('assigned to') && a.action.includes('waiting'),
    )
    const mustCall = state.directives.some((d) => d.must)
    const staffAccepted = state.directives.some(
      (d) => d.must && (d.status === 'accepted' || d.status === 'completed'),
    )
    const chartComplete = state.activity.some((a) => a.action === 'Completed intake chart')
    return [
      { label: 'Waiting patient visible', done: waiting.length > 0 || assigned },
      { label: 'Patient assigned to room', done: assigned },
      { label: 'Doctor call issued', done: mustCall },
      { label: 'Staff accepted and moved', done: staffAccepted },
      { label: 'Urgent chart completed', done: chartComplete },
    ]
  }, [state.activity, state.directives, waiting.length])

  function assignNextNow() {
    if (!isAdminView) return
    const actions = planAiTick(state, { forceAssignment: true })
    if (actions.length === 0) return
    dispatch(actions.length === 1 ? actions[0]! : { type: 'AI_BATCH', payload: actions })
  }

  function advancePatientEvent() {
    if (!isAdminView) return
    const actions = planAiTick(state, { forceLifecycle: true })
    if (actions.length === 0) return
    dispatch(actions.length === 1 ? actions[0]! : { type: 'AI_BATCH', payload: actions })
  }

  function resetDemo() {
    if (!isAdminView) return
    if (!window.confirm('Reset the complete simulation back to the seeded demo state?')) return
    dispatch({ type: 'RESET_DEMO' })
    setWaitPatientId('')
    setWaitRoomId('')
    setReassignPatientId('')
    setReassignRoomId('')
    setForceStaffId('')
    setForceRoomId('')
  }

  function adminAssignWaiting() {
    if (!isAdminView) return
    const patientId = waitPatientId || waiting[0]?.id
    const roomId = waitRoomId || freeRooms[0]?.id
    if (!patientId || !roomId) return
    dispatch({
      type: 'MOVE_PATIENT',
      payload: { patientId, roomId, by: 'admin', note: 'Admin Demo Live override' },
    })
  }

  function adminReassign() {
    if (!isAdminView) return
    const patientId = reassignPatientId
    const roomId = reassignRoomId || freeRooms[0]?.id
    if (!patientId || !roomId) return
    dispatch({
      type: 'MOVE_PATIENT',
      payload: { patientId, roomId, by: 'admin', note: 'Admin reassign' },
    })
  }

  function forceStaff() {
    if (!isAdminView) return
    if (!forceStaffId) return
    dispatch({
      type: 'SET_STAFF_LOCATION',
      payload: {
        staffId: forceStaffId,
        roomId: forceRoomId === '' ? null : forceRoomId,
      },
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            Admin · Demo Live
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Patient movement demo</h1>
          <p className="mt-1 text-sm text-slate-500">
            Same hospital floor as General simulation — with admin overrides. Waiting → agent
            assign → staff moves on must-moves.
            {!isAdminView && (
              <span className="ml-1 text-amber-700">Tip: Viewing as Admin.</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={assignNextNow}
            disabled={!isAdminView || waiting.length === 0 || freeRooms.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-violet-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Sparkles className="h-4 w-4" /> Assign next now
          </button>
          <button
            type="button"
            onClick={advancePatientEvent}
            disabled={!isAdminView}
            className="inline-flex items-center gap-1.5 rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-950 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <FastForward className="h-4 w-4" /> Advance patient event
          </button>
          <button
            type="button"
            onClick={() =>
              isAdminView &&
              dispatch({
                type: 'SET_AGENT_ASSIGN',
                payload: { enabled: !assignEnabled },
              })
            }
            disabled={!isAdminView}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${
              assignEnabled
                ? 'border border-amber-300 bg-amber-50 text-amber-950'
                : 'bg-emerald-700 text-white'
            }`}
          >
            {assignEnabled ? (
              <>
                <Pause className="h-4 w-4" /> Pause simulation
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Resume simulation
              </>
            )}
          </button>
          <button
            type="button"
            onClick={resetDemo}
            disabled={!isAdminView}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            <RotateCcw className="h-4 w-4" /> Reset demo
          </button>
        </div>
      </div>

      <SimClockBar
        lastAgentTickAt={state.lastAgentTickAt}
        simulationEnabled={assignEnabled}
        nextSimulationAt={state.nextSimulationAt}
        waitingCount={waiting.length}
      />

      <section className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-violet-950">Guided demo</h2>
            <p className="text-xs text-violet-800">
              Use Reset demo, then Assign next now to keep the reviewer flow predictable.
            </p>
          </div>
          <span className="text-xs font-medium text-violet-800">
            {checklist.filter((step) => step.done).length}/{checklist.length} complete
          </span>
        </div>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {checklist.map((step) => (
            <li
              key={step.label}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs ${
                step.done ? 'bg-emerald-100 text-emerald-900' : 'bg-white text-slate-600'
              }`}
            >
              {step.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
              {step.label}
            </li>
          ))}
        </ol>
      </section>

      {state.directives.some((d) => d.must && d.status === 'pending') && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-red-950">Staff response needed</p>
            <p className="text-xs text-red-800">
              Switch to the assigned responder and open Staff movement to Accept & Move.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.directives
              .filter((d) => d.must && d.status === 'pending')
              .slice(0, 2)
              .map((d) => {
                const responder = state.staff.find((s) => s.id === d.staffId)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setViewingAs(d.staffId)
                      navigate('/move')
                    }}
                    className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Switch to {responder?.name ?? 'responder'}
                  </button>
                )
              })}
          </div>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-3">
          <ClinicFloorPlan
            rooms={state.rooms}
            patients={state.patients}
            staff={state.staff}
            compact
          />
          {incompleteCharts.length > 0 && (
            <p className="text-xs text-amber-800">
              Incomplete charts:{' '}
              {incompleteCharts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/admin/intake/${p.id}`}
                    className="mr-2 underline"
                  >
                    {p.name}
                    {p.roomId
                      ? ` · ${state.rooms.find((r) => r.id === p.roomId)?.name ?? p.roomId}`
                      : ' · waiting'}
                  </Link>
                ))}
            </p>
          )}
        </div>
        <SimLiveFeeds
          aiThoughts={state.aiThoughts}
          activity={state.activity}
          directives={state.directives}
          staff={state.staff}
          rooms={state.rooms}
          compact
        />
      </div>

      <section className="rounded-xl border-2 border-slate-300 bg-slate-50 p-5 shadow-sm">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Siren className="h-4 w-4 text-violet-700" />
          Admin interfere
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Override the simulation: assign waiting patients, reassign rooms, or move staff.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
              Assign from waiting
            </p>
            <select
              value={waitPatientId}
              onChange={(e) => setWaitPatientId(e.target.value)}
              className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Pick patient…</option>
              {waiting.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.acuity})
                </option>
              ))}
            </select>
            <select
              value={waitRoomId}
              onChange={(e) => setWaitRoomId(e.target.value)}
              className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Pick free room…</option>
              {freeRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={adminAssignWaiting}
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              Assign now
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
              Reassign in-room patient
            </p>
            <select
              value={reassignPatientId}
              onChange={(e) => setReassignPatientId(e.target.value)}
              className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Pick patient…</option>
              {state.patients
                .filter((p) => !p.visitComplete && p.roomId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {state.rooms.find((r) => r.id === p.roomId)?.name}
                  </option>
                ))}
            </select>
            <select
              value={reassignRoomId}
              onChange={(e) => setReassignRoomId(e.target.value)}
              className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">New free room…</option>
              {freeRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={adminReassign}
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              Reassign
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
              Force staff location
            </p>
            <select
              value={forceStaffId}
              onChange={(e) => setForceStaffId(e.target.value)}
              className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Pick staff…</option>
              {clinicians.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
            <select
              value={forceRoomId}
              onChange={(e) => setForceRoomId(e.target.value)}
              className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Station (leave room)</option>
              {state.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={forceStaff}
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              Move staff
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
