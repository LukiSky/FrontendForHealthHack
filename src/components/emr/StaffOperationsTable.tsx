import type { Dispatch } from 'react'
import { ArrowDown, ArrowUp, Edit, UserCheck } from 'lucide-react'
import type { Patient, Room, SimulationAction, SimulationState, StaffMember } from '../../state/types'

interface StaffOperationsTableProps {
  state: SimulationState
  dispatch: Dispatch<SimulationAction>
}

function staffLabel(staffMembers: StaffMember[], staffId: string | null): string {
  if (!staffId) return '—'
  const s = staffMembers.find((m) => m.id === staffId)
  return s ? `${s.name}` : staffId
}

function locationLabel(patient: Patient): string {
  if (patient.location === 'triage') return 'Triage Queue'
  if (patient.location === 'discharged') return 'Discharged'
  return patient.location
}

export function StaffOperationsTable({ state, dispatch }: StaffOperationsTableProps) {
  const active = state.patients.filter((p) => p.status !== 'discharged')
  const activeStaff = state.staffMembers.find((s) => s.id === state.activeStaffId)

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Edit className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-800">Staff Operations</h2>
        </div>
        <span className="text-xs text-slate-500">
          Acting as: <span className="font-medium text-slate-700">{activeStaff?.name ?? '—'}</span>
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Patient ID</th>
              <th className="px-3 py-2 font-medium">Current Room</th>
              <th className="px-3 py-2 font-medium">Assigned Staff</th>
              <th className="px-3 py-2 font-medium">Triage</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {active.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  No active patients. Admit from intake or enable auto-generate.
                </td>
              </tr>
            ) : (
              active.map((patient) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  rooms={state.rooms}
                  staffMembers={state.staffMembers}
                  dispatch={dispatch}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PatientRow({
  patient,
  rooms,
  staffMembers,
  dispatch,
}: {
  patient: Patient
  rooms: Room[]
  staffMembers: StaffMember[]
  dispatch: Dispatch<SimulationAction>
}) {
  const availableRooms = rooms.filter(
    (r) => r.patientId === null || r.patientId === patient.id,
  )

  return (
    <tr className={`border-t border-slate-100 ${patient.crashed ? 'bg-red-50' : 'bg-white'}`}>
      <td className="px-3 py-2 font-mono text-xs text-slate-800">
        {patient.id}
        <div className="font-sans text-[11px] text-slate-500">{patient.name}</div>
      </td>
      <td className="px-3 py-2 text-slate-700">{locationLabel(patient)}</td>
      <td className="px-3 py-2 text-slate-700">
        {staffLabel(staffMembers, patient.assignedStaffId)}
      </td>
      <td className="px-3 py-2">
        <span
          className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold ${
            patient.triageLevel === 1
              ? 'bg-red-100 text-red-700'
              : patient.triageLevel === 2
                ? 'bg-amber-100 text-amber-700'
                : 'bg-sky-100 text-sky-700'
          }`}
        >
          L{patient.triageLevel}
          {patient.crashed ? ' !' : ''}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={patient.location === 'triage' || patient.location === 'discharged' ? '' : patient.location}
            onChange={(e) => {
              if (!e.target.value) return
              dispatch({
                type: 'MOVE_PATIENT',
                payload: { patientId: patient.id, roomId: e.target.value },
              })
            }}
            className="max-w-[120px] rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-700"
            title="Update Location"
          >
            <option value="" disabled>
              Update Location
            </option>
            {patient.location === 'triage' && (
              <option value="" disabled>
                Triage Queue
              </option>
            )}
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}
              </option>
            ))}
          </select>

          <button
            type="button"
            title="Escalate triage"
            onClick={() => dispatch({ type: 'ESCALATE', payload: { patientId: patient.id } })}
            className="inline-flex items-center rounded border border-red-200 bg-red-50 px-1.5 py-1 text-xs text-red-700 hover:bg-red-100"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            title="De-escalate triage"
            onClick={() => dispatch({ type: 'DEESCALATE', payload: { patientId: patient.id } })}
            className="inline-flex items-center rounded border border-sky-200 bg-sky-50 px-1.5 py-1 text-xs text-sky-700 hover:bg-sky-100"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
          <button
            type="button"
            title="Assign Self"
            onClick={() => dispatch({ type: 'ASSIGN_SELF', payload: { patientId: patient.id } })}
            disabled={patient.location === 'triage'}
            className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-xs text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <UserCheck className="h-3 w-3" />
            Assign Self
          </button>
        </div>
      </td>
    </tr>
  )
}
