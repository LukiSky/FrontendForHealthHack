import { useNavigate } from 'react-router-dom'
import { Bot, UserRound } from 'lucide-react'
import { useClinic } from '../../store/clinicStore'
import { homePathForView, type ViewingAs } from '../../state/types'

export function DemoRoleSwitcher() {
  const { state, setViewingAs, viewingStaff, isGeneralView, isAdminView, isAiView } =
    useClinic()
  const navigate = useNavigate()
  const clinicians = state.staff.filter((s) => s.role !== 'admin')

  const label = isGeneralView
    ? 'General'
    : isAiView
      ? 'Demo Agent'
      : isAdminView
        ? 'Admin'
        : viewingStaff?.name ?? 'Staff'

  function onChange(next: ViewingAs) {
    setViewingAs(next)
    navigate(homePathForView(next))
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
      {isAiView ? (
        <Bot className="h-4 w-4 shrink-0 text-violet-700" />
      ) : (
        <UserRound className="h-4 w-4 shrink-0 text-amber-700" />
      )}
      <div className="flex min-w-0 flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
          Demo — Viewing as
        </span>
        <select
          value={state.viewingAs}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-[220px] border-0 bg-transparent p-0 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-0"
          aria-label="Switch demo identity and menu"
        >
          <optgroup label="Shared">
            <option value="general">General (everyone)</option>
            <option value="ai">Demo Agent (thoughts)</option>
          </optgroup>
          <optgroup label="Admin">
            <option value="admin">Admin</option>
          </optgroup>
          <optgroup label="Staff">
            {clinicians.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <span
        className={`hidden shrink-0 rounded px-2 py-0.5 text-xs sm:inline ${
          isAiView ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
