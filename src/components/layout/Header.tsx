import type { ComponentType, Dispatch } from 'react'
import { Activity, Bed, Pause, Play, Users } from 'lucide-react'
import type { SimulationAction, SimulationState } from '../../state/types'

interface HeaderProps {
  state: SimulationState
  dispatch: Dispatch<SimulationAction>
}

export function Header({ state, dispatch }: HeaderProps) {
  const activePatients = state.patients.filter((p) => p.status !== 'discharged')
  const occupiedRooms = state.rooms.filter((r) => r.patientId !== null).length
  const idleStaff = state.staffMembers.filter((s) => s.status === 'idle').length
  const critical = activePatients.filter((p) => p.triageLevel === 1 || p.crashed).length

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors ${
            state.isRunning
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {state.isRunning ? (
            <>
              <Pause className="h-4 w-4" /> Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Play
            </>
          )}
        </button>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={state.autoGeneratePatients}
            onChange={() => dispatch({ type: 'TOGGLE_AUTO_GENERATE' })}
            className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Auto-Generate Patients
        </label>

        <span className="hidden text-xs text-slate-400 sm:inline">
          Tick #{state.tickCount} · {state.tickRateMs}ms
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Stat icon={Users} label="Patients" value={activePatients.length} />
        <Stat icon={Bed} label="Occupied" value={`${occupiedRooms}/30`} />
        <Stat icon={Activity} label="Idle staff" value={idleStaff} />
        <Stat
          icon={Activity}
          label="Critical"
          value={critical}
          accent={critical > 0 ? 'text-red-600' : undefined}
        />
      </div>
    </header>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
      <Icon className={`h-3.5 w-3.5 ${accent ?? 'text-slate-500'}`} />
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`font-semibold tabular-nums ${accent ?? 'text-slate-800'}`}>{value}</span>
    </div>
  )
}
