import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
import { createSeedState } from '../data/seed'
import { useAiAgent } from '../hooks/useAiAgent'
import { clinicReducer } from '../state/reducer'
import type { ClinicAction, ClinicState, StaffMember, ViewingAs } from '../state/types'
import { homePathForView, isStaffViewingAs } from '../state/types'

const STORAGE_KEY = 'clinic-room-mgmt-v4'
const CHANNEL_NAME = 'clinic-room-mgmt-sync-v4'
const VIEW_KEY = 'clinic-viewing-as'

type SharedState = Omit<ClinicState, 'viewingAs'>

function migrateShared(raw: Partial<ClinicState>): SharedState {
  const seed = createSeedState()
  const { viewingAs: _, ...seedRest } = seed
  return {
    ...seedRest,
    ...raw,
    rooms: (raw.rooms?.length ? raw.rooms : seedRest.rooms).map((r, i) => ({
      ...seedRest.rooms[i % seedRest.rooms.length]!,
      ...r,
      x: r.x ?? seedRest.rooms.find((s) => s.id === r.id)?.x ?? i * 12,
      y: r.y ?? seedRest.rooms.find((s) => s.id === r.id)?.y ?? 0,
    })),
    patients: (raw.patients ?? seedRest.patients).map((p) => ({
      ...p,
      carePhase: p.carePhase ?? 'awaiting_exam',
      acuity: p.acuity ?? 'routine',
    })),
    staff: (raw.staff ?? seedRest.staff).map((s) => ({
      ...s,
      currentTaskId: s.currentTaskId ?? null,
    })),
    activity: raw.activity ?? seedRest.activity,
    directives: (raw.directives ?? seedRest.directives).map((d) => ({
      ...d,
      must: d.must ?? false,
    })),
    aiThoughts: raw.aiThoughts ?? seedRest.aiThoughts,
    version: raw.version ?? 1,
  }
}

function loadShared(): SharedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return migrateShared({})
    const parsed = JSON.parse(raw) as ClinicState
    if (!parsed?.rooms?.length || !parsed?.staff?.length) return migrateShared({})
    return migrateShared(parsed)
  } catch {
    return migrateShared({})
  }
}

function loadViewingAs(): ViewingAs {
  try {
    const raw = sessionStorage.getItem(VIEW_KEY)
    if (raw === 'general' || raw === 'admin' || raw === 'ai') return raw
    if (raw && raw.length > 0) return raw
    return 'general'
  } catch {
    return 'general'
  }
}

function persistShared(state: ClinicState) {
  const { viewingAs: _, ...rest } = state
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch {
    // ignore
  }
}

interface ClinicContextValue {
  state: ClinicState
  dispatch: Dispatch<ClinicAction>
  viewingStaff: StaffMember | null
  isGeneralView: boolean
  isAdminView: boolean
  isAiView: boolean
  isStaffView: boolean
  homePath: string
  setViewingAs: (viewingAs: ViewingAs) => void
}

const ClinicContext = createContext<ClinicContextValue | null>(null)

function AiAgentRunner({
  state,
  dispatch,
}: {
  state: ClinicState
  dispatch: Dispatch<ClinicAction>
}) {
  useAiAgent(state, dispatch)
  return null
}

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [shared, rawDispatch] = useReducer(
    (s: SharedState, a: ClinicAction): SharedState => {
      if (a.type === 'SET_VIEWING_AS') return s
      const full = clinicReducer({ ...s, viewingAs: 'general' }, a)
      const { viewingAs: _, ...rest } = full
      return rest
    },
    undefined,
    loadShared,
  )
  const [viewingAs, setViewingAsState] = useState<ViewingAs>(loadViewingAs)
  const skipBroadcast = useRef(false)
  const channelRef = useRef<BroadcastChannel | null>(null)

  const state: ClinicState = useMemo(
    () => ({ ...shared, viewingAs }),
    [shared, viewingAs],
  )

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel
    channel.onmessage = (event: MessageEvent<SharedState>) => {
      if (!event.data?.version) return
      skipBroadcast.current = true
      rawDispatch({
        type: 'HYDRATE',
        payload: { ...migrateShared(event.data), viewingAs: 'general' },
      })
    }
    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [])

  useEffect(() => {
    persistShared(state)
    if (skipBroadcast.current) {
      skipBroadcast.current = false
      return
    }
    const { viewingAs: _, ...rest } = state
    channelRef.current?.postMessage(rest)
  }, [shared])

  const dispatch: Dispatch<ClinicAction> = useCallback((action) => {
    if (action.type === 'SET_VIEWING_AS') {
      setViewingAsState(action.payload.viewingAs)
      try {
        sessionStorage.setItem(VIEW_KEY, action.payload.viewingAs)
      } catch {
        // ignore
      }
      return
    }
    rawDispatch(action)
  }, [])

  const setViewingAs = useCallback((next: ViewingAs) => {
    setViewingAsState(next)
    try {
      sessionStorage.setItem(VIEW_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  const isGeneralView = viewingAs === 'general'
  const isAdminView = viewingAs === 'admin'
  const isAiView = viewingAs === 'ai'
  const isStaffView = isStaffViewingAs(viewingAs)
  const homePath = homePathForView(viewingAs)

  const viewingStaff = useMemo(() => {
    if (viewingAs === 'general' || viewingAs === 'ai') return null
    if (viewingAs === 'admin') {
      return state.staff.find((s) => s.role === 'admin') ?? null
    }
    return state.staff.find((s) => s.id === viewingAs) ?? null
  }, [state.staff, viewingAs])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      viewingStaff,
      isGeneralView,
      isAdminView,
      isAiView,
      isStaffView,
      homePath,
      setViewingAs,
    }),
    [
      state,
      dispatch,
      viewingStaff,
      isGeneralView,
      isAdminView,
      isAiView,
      isStaffView,
      homePath,
      setViewingAs,
    ],
  )

  return (
    <ClinicContext.Provider value={value}>
      <AiAgentRunner state={state} dispatch={dispatch} />
      {children}
    </ClinicContext.Provider>
  )
}

export function useClinic(): ClinicContextValue {
  const ctx = useContext(ClinicContext)
  if (!ctx) throw new Error('useClinic must be used within ClinicProvider')
  return ctx
}
