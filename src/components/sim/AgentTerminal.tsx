import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'
import type { LogEntry } from '../../state/types'

interface AgentTerminalProps {
  logs: LogEntry[]
}

export function AgentTerminal({ logs }: AgentTerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  return (
    <section className="flex min-h-[180px] flex-1 flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
        <Terminal className="h-4 w-4 text-emerald-400" />
        <h2 className="text-sm font-semibold text-slate-100">Agent Terminal</h2>
        <span className="ml-auto font-mono text-[10px] text-slate-500">{logs.length} events</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 py-0.5">
            <span className="shrink-0 text-slate-500">[{log.timestamp}]</span>
            <span
              className={`shrink-0 font-semibold ${
                log.source === 'manual' ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {log.source === 'manual' ? 'MANUAL' : log.agent ?? 'AGENT'}
            </span>
            <span className="text-slate-300">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </section>
  )
}
