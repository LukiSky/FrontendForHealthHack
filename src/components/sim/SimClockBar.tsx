import { Clock, Radio } from 'lucide-react'
import { useSimClock } from '../../hooks/useSimClock'
import { formatLiveClock, formatTime, relativeTime } from '../../utils/ids'

type SimClockBarProps = {
  lastAgentTickAt: string
  simulationEnabled: boolean
  nextSimulationAt: number
  waitingCount: number
}

/** Live simulation clock + next-assign countdown — makes time progression obvious. */
export function SimClockBar({
  lastAgentTickAt,
  simulationEnabled,
  nextSimulationAt,
  waitingCount,
}: SimClockBarProps) {
  const nowMs = useSimClock()
  const untilEventSec = Math.max(0, Math.ceil((nextSimulationAt - nowMs) / 1000))
  const tickAgeSec = Math.max(
    0,
    Math.floor((nowMs - new Date(lastAgentTickAt).getTime()) / 1000),
  )
  const tickFresh = tickAgeSec <= 3

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-slate-50 px-3 py-2.5 text-xs shadow-sm">
      <div className="flex items-center gap-2 font-mono text-sm font-semibold tabular-nums text-emerald-950">
        <Clock className="h-4 w-4 text-emerald-700" />
        <span>{formatLiveClock(nowMs)}</span>
        <span className="font-sans text-[10px] font-medium uppercase tracking-wide text-emerald-700/80">
          sim time
        </span>
      </div>

      <div
        className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono tabular-nums ${
          tickFresh
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-200/80 text-slate-600'
        }`}
      >
        <Radio className={`h-3 w-3 ${tickFresh ? 'animate-pulse' : ''}`} />
        <span>tick {formatTime(lastAgentTickAt)}</span>
        <span className="opacity-80">({relativeTime(lastAgentTickAt, nowMs)})</span>
      </div>

      {!simulationEnabled ? (
        <span className="rounded-md bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
          Simulation paused
        </span>
      ) : untilEventSec > 0 ? (
        <span className="rounded-md bg-violet-100 px-2 py-0.5 font-mono font-semibold tabular-nums text-violet-900">
          Next patient event in {untilEventSec}s · {waitingCount} waiting
        </span>
      ) : waitingCount > 0 ? (
        <span className="rounded-md bg-violet-600 px-2 py-0.5 font-medium text-white animate-pulse">
          Processing patient event…
        </span>
      ) : (
        <span className="text-slate-500">No patients waiting</span>
      )}
    </div>
  )
}
