import {
  Activity,
  Bed,
  LayoutDashboard,
  Stethoscope,
  Terminal,
  UserPlus,
} from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'intake', label: 'Intake', icon: UserPlus },
  { id: 'operations', label: 'Operations', icon: Stethoscope },
  { id: 'simulation', label: 'Simulation', icon: Bed },
] as const

interface SidebarProps {
  activeSection?: string
  onNavigate?: (id: string) => void
}

export function Sidebar({ activeSection = 'dashboard', onNavigate }: SidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col bg-slate-900 text-slate-100">
      <div className="border-b border-slate-700 px-4 py-5">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold tracking-wide">TriageEMR</p>
            <p className="text-[11px] text-slate-400">Hybrid Multi-Agent</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate?.(id)}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-700 p-3">
        <div className="flex items-center gap-2 rounded-md bg-slate-800/80 px-3 py-2 text-xs text-slate-400">
          <Terminal className="h-3.5 w-3.5" />
          Agents live
        </div>
      </div>
    </aside>
  )
}
