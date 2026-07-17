import { useEffect, useRef } from 'react'
import { planAiTick } from '../agents/aiManager'
import type { ClinicAction, ClinicState } from '../state/types'

const LEADER_KEY = 'clinic-ai-leader'
const TICK_MS = 1500
const LEADER_TTL_MS = 4000

function tabId(): string {
  try {
    let id = sessionStorage.getItem('clinic-tab-id')
    if (!id) {
      id = `tab-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem('clinic-tab-id', id)
    }
    return id
  } catch {
    return `tab-${Math.random().toString(36).slice(2, 10)}`
  }
}

function tryBecomeLeader(id: string): boolean {
  try {
    const raw = localStorage.getItem(LEADER_KEY)
    const now = Date.now()
    if (raw) {
      const { id: lid, at } = JSON.parse(raw) as { id: string; at: number }
      if (lid !== id && now - at < LEADER_TTL_MS) return false
    }
    localStorage.setItem(LEADER_KEY, JSON.stringify({ id, at: now }))
    return true
  } catch {
    return true
  }
}

function heartbeat(id: string) {
  try {
    localStorage.setItem(LEADER_KEY, JSON.stringify({ id, at: Date.now() }))
  } catch {
    // ignore
  }
}

/**
 * Runs the mock AI Manager on a single leader tab so multi-window demos don't double-dispatch.
 * Always stamps AGENT_TICK so the sim clock / feeds visibly advance.
 */
export function useAiAgent(
  state: ClinicState,
  dispatch: (action: ClinicAction) => void,
) {
  const stateRef = useRef(state)
  stateRef.current = state
  const idRef = useRef(tabId())

  useEffect(() => {
    const id = idRef.current
    const timer = setInterval(() => {
      if (!tryBecomeLeader(id)) return
      heartbeat(id)
      const at = new Date().toISOString()
      const planned = planAiTick(stateRef.current)
      const batch: ClinicAction[] = [
        { type: 'AGENT_TICK', payload: { at } },
        ...planned,
      ]
      if (batch.length === 1) {
        dispatch(batch[0]!)
      } else {
        dispatch({ type: 'AI_BATCH', payload: batch })
      }
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [dispatch])
}
