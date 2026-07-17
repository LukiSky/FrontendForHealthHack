import { AlertTriangle, Check, X } from 'lucide-react'
import { useClinic } from '../../store/clinicStore'
import type { AiDirective } from '../../state/types'

export function AiDirectivePanel({ staffId }: { staffId: string }) {
  const { state } = useClinic()
  const pending = state.directives.find(
    (d) => d.staffId === staffId && d.status === 'pending' && d.must,
  )
  const accepted = state.directives.find(
    (d) => d.staffId === staffId && d.status === 'accepted' && d.must,
  )
  // Fall back to any pending for backwards compatibility, but prefer must
  const directive =
    pending ??
    accepted ??
    state.directives.find((d) => d.staffId === staffId && d.status === 'pending') ??
    state.directives.find((d) => d.staffId === staffId && d.status === 'accepted')

  if (!directive) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Critical must-move</h2>
        <p className="mt-2 text-sm text-slate-400">
          No doctor-issued must-move for you. Demo Agent does not auto-route routine cases.
        </p>
      </section>
    )
  }

  return <DirectiveCard directive={directive} canAct={directive.status === 'pending'} />
}

function DirectiveCard({
  directive,
  canAct,
}: {
  directive: AiDirective
  canAct: boolean
}) {
  const { state, dispatch } = useClinic()
  const room = state.rooms.find((r) => r.id === directive.roomId)
  const patient = state.patients.find((p) => p.id === directive.patientId)

  return (
    <section
      className={`rounded-lg border-2 p-4 shadow-sm ${
        directive.must
          ? 'border-red-400 bg-red-50'
          : directive.priority === 'high'
            ? 'border-amber-400 bg-amber-50'
            : 'border-violet-300 bg-violet-50'
      }`}
    >
      <div className="mb-2 flex items-start gap-2">
        <AlertTriangle
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            directive.must ? 'text-red-700' : 'text-amber-600'
          }`}
        />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-800">
            {directive.must
              ? directive.status === 'pending'
                ? 'Critical must-move — doctor ordered'
                : 'Critical must-move — in progress'
              : directive.status === 'pending'
                ? 'Action required'
                : 'In progress'}
          </p>
          <h2 className="text-lg font-semibold text-slate-900">{directive.title}</h2>
          <p className="mt-1 text-sm text-slate-700">{directive.reason}</p>
          <p className="mt-1 text-xs text-slate-500">
            {room?.name} · {patient?.name ?? directive.patientId}
            {directive.must ? ' · MUST' : ''}
          </p>
        </div>
      </div>

      {canAct ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'ACCEPT_DIRECTIVE',
                payload: { directiveId: directive.id },
              })
            }
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Check className="h-4 w-4" />
            Accept &amp; Move
          </button>
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'DECLINE_DIRECTIVE',
                payload: { directiveId: directive.id },
              })
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            Decline / Busy
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs font-medium text-emerald-800">
          Accepted — location updated to {room?.name}. Complete care in the room.
        </p>
      )}
    </section>
  )
}
