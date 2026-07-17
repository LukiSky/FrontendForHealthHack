import { Link } from 'react-router-dom'
import { Bot, ListTree, PhoneCall } from 'lucide-react'
import { useSimClock } from '../../hooks/useSimClock'
import type { ActivityEntry, AiDirective, AiThought, StaffMember } from '../../state/types'
import { formatTime, relativeTime } from '../../utils/ids'

type SimLiveFeedsProps = {
  aiThoughts: AiThought[]
  activity: ActivityEntry[]
  directives: AiDirective[]
  staff: StaffMember[]
  rooms: { id: string; name: string }[]
  compact?: boolean
}

function isFresh(at: string, nowMs: number, windowSec = 4): boolean {
  return nowMs - new Date(at).getTime() < windowSec * 1000
}

/** Agent thoughts + doctor moves + must-move calls — shared by General sim & Admin Demo Live */
export function SimLiveFeeds({
  aiThoughts,
  activity,
  directives,
  staff,
  rooms,
  compact = false,
}: SimLiveFeedsProps) {
  const nowMs = useSimClock()

  const liveActivity = activity.slice(0, compact ? 8 : 16)

  const doctorCalls = directives.filter(
    (d) => d.must && (d.status === 'pending' || d.status === 'accepted'),
  )

  const feedMax = compact ? 'max-h-36' : 'max-h-48'

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3 shadow-sm">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-violet-950">
          <Bot className="h-4 w-4" />
          AI decisions
          <span className="ml-auto text-[10px] font-normal text-violet-600">why the next event happened</span>
        </h2>
        <ul className="max-h-28 space-y-1.5 overflow-y-auto text-xs text-slate-700">
          {aiThoughts.slice(0, compact ? 3 : 5).map((thought) => (
            <li key={thought.id} className="border-b border-violet-100 pb-1.5 last:border-0">
              <span className="font-mono tabular-nums text-violet-600">{formatTime(thought.at)}</span>{' '}
              <span className="text-[10px] text-violet-500">({relativeTime(thought.at, nowMs)})</span>{' '}
              {thought.message}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-3 shadow-sm">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-sky-950">
          <ListTree className="h-4 w-4" />
          Simulation event log
        </h2>
        <ul className={`${feedMax} space-y-1.5 overflow-y-auto text-xs text-slate-700`}>
          {liveActivity.length === 0 ? (
            <li className="text-slate-400">
              No changes yet — patient assignment and Accept & Move will show here.
            </li>
          ) : (
            liveActivity.map((a) => {
              const who = staff.find((s) => s.id === a.staffId)?.name ?? a.patientName
              const fresh = isFresh(a.at, nowMs)
              return (
                <li
                  key={a.id}
                  className={`border-b border-sky-100/80 pb-1.5 last:border-0 ${
                    fresh ? 'rounded-md bg-sky-100/90 px-1.5 py-1 font-medium' : ''
                  }`}
                >
                  <span className="font-mono tabular-nums text-sky-600">
                    {formatTime(a.at)}
                  </span>{' '}
                  <span className="text-[10px] text-sky-500">
                    ({relativeTime(a.at, nowMs)})
                  </span>{' '}
                  <span className="font-medium">{who}</span> — {a.action}
                </li>
              )
            })
          )}
        </ul>
      </div>

      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3 shadow-sm">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-rose-950">
          <PhoneCall className="h-4 w-4" />
          Doctor calls
        </h2>
        <ul className={`${feedMax} space-y-1.5 overflow-y-auto text-xs text-slate-700`}>
          {doctorCalls.length === 0 ? (
            <li className="text-slate-400">No active must-moves.</li>
          ) : (
            doctorCalls.map((d) => {
              const target = staff.find((s) => s.id === d.staffId)?.name ?? d.staffId
              const room = rooms.find((r) => r.id === d.roomId)?.name ?? d.roomId
              return (
                <li key={d.id} className="border-b border-rose-100/80 pb-1.5 last:border-0">
                  <span className="font-medium capitalize text-rose-800">{d.status}</span>
                  {' · '}
                  {target} →{' '}
                  <Link to={`/room/${d.roomId}`} className="font-medium text-rose-800 underline">
                    {room}
                  </Link>
                  {d.reason ? ` — ${d.reason}` : ''}
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
