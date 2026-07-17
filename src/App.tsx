import { useMemo, useState } from 'react'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { AdminIntakeForm } from './components/emr/AdminIntakeForm'
import { StaffOperationsTable } from './components/emr/StaffOperationsTable'
import { WardGrid } from './components/sim/WardGrid'
import { AgentTerminal } from './components/sim/AgentTerminal'
import { useSimulation } from './hooks/useSimulation'

export default function App() {
  const [state, dispatch] = useSimulation()
  const [section, setSection] = useState('dashboard')

  const admitNonce = useMemo(
    () => state.patients.length + state.tickCount,
    [state.patients.length, state.tickCount],
  )

  return (
    <div className="flex min-h-[800px] h-screen bg-slate-50 text-slate-900">
      <Sidebar activeSection={section} onNavigate={setSection} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header state={state} dispatch={dispatch} />

        <main className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-2">
          {/* Left: EMR Control Center */}
          <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <AdminIntakeForm dispatch={dispatch} admitNonce={admitNonce} />
            <StaffOperationsTable state={state} dispatch={dispatch} />
          </div>

          {/* Right: Live Simulation */}
          <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <div className="max-h-[55%] overflow-y-auto">
              <WardGrid state={state} />
            </div>
            <AgentTerminal logs={state.logs} />
          </div>
        </main>
      </div>
    </div>
  )
}
