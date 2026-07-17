import { Link } from 'react-router-dom'
import { ArrowRight, Bot } from 'lucide-react'
import { ClinicFloorPlan } from '../components/sim/ClinicFloorPlan'
import { SimClockBar } from '../components/sim/SimClockBar'
import { SimLiveFeeds } from '../components/sim/SimLiveFeeds'
import { useClinic } from '../store/clinicStore'

/**
 * General (shared) home: full hospital floor simulation — waiting, 30 rooms,
 * staff tokens, Demo Agent feed. Replaces the old KPI/tables Ops dashboard.
 */
export function OpsDashboardPage() {
  const { state, isGeneralView, isAdminView } = useClinic()
  const waitingCount = state.patients.filter((p) => !p.visitComplete && !p.roomId).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            {isGeneralView ? 'General' : isAdminView ? 'Admin' : 'Shared'} · Simulation
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Clinic floor simulation</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Patients progress through a predictable clinical record after rooming. Staff locations
            change only when a clinician takes care, accepts a must-move, or an admin overrides.
          </p>
        </div>
        {isAdminView && (
          <Link
            to="/admin/demo"
            className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 hover:underline"
          >
            Admin Demo Live <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <SimClockBar
        lastAgentTickAt={state.lastAgentTickAt}
        simulationEnabled={state.agentAssignEnabled !== false}
        nextSimulationAt={state.nextSimulationAt}
        waitingCount={waitingCount}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
        <Bot className="h-3.5 w-3.5 text-violet-600" />
        <span>
          <strong className="font-semibold text-slate-800">How it works:</strong> Waiting bay →
          patient is roomed → vitals and review status update → clinician care and movements remain
          explicit actions.
        </span>
        <span className="ml-auto text-slate-400">
          Simulation {state.agentAssignEnabled !== false ? 'on' : 'paused'}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <ClinicFloorPlan
          rooms={state.rooms}
          patients={state.patients}
          staff={state.staff}
        />
        <SimLiveFeeds
          aiThoughts={state.aiThoughts}
          activity={state.activity}
          directives={state.directives}
          staff={state.staff}
          rooms={state.rooms}
        />
      </div>
    </div>
  )
}
