import type { Acuity } from '../state/types'

const labels: Record<Acuity, string> = {
  routine: 'Routine',
  urgent: 'Urgent',
  critical: 'Critical',
}

const styles: Record<Acuity, string> = {
  routine: 'bg-sky-100 text-sky-800 ring-sky-200',
  urgent: 'bg-amber-100 text-amber-900 ring-amber-300',
  critical: 'bg-rose-100 text-rose-900 ring-rose-300',
}

/** Consistent, immediately recognizable triage indicator across every workflow. */
export function AcuityBadge({
  acuity,
  compact = false,
}: {
  acuity: Acuity
  compact?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide ring-1 ${styles[acuity]} ${
        compact ? 'px-1 py-px text-[8px]' : 'px-2 py-0.5 text-[10px]'
      }`}
    >
      {compact ? acuity.slice(0, 3) : labels[acuity]}
    </span>
  )
}
