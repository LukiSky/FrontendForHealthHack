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
import { clinicReducer, roomStatusFromPatients } from '../state/reducer'
import type { ClinicAction, ClinicState, StaffMember, ViewingAs } from '../state/types'
import { emptyPatientProfile, emptyVitals, homePathForView, isStaffViewingAs } from '../state/types'

const STORAGE_KEY = 'clinic-room-mgmt-v6'
const CHANNEL_NAME = 'clinic-room-mgmt-sync-v6'
const VIEW_KEY = 'clinic-viewing-as'

type SharedState = Omit<ClinicState, 'viewingAs'>

function migrateShared(raw: Partial<ClinicState>): SharedState {
  const seed = createSeedState()
  const { viewingAs: _, ...seedRest } = seed
  const migrated: SharedState = {
    ...seedRest,
    ...raw,
    rooms: (() => {
      const rawRooms = raw.rooms ?? []
      // Always prefer full 30-room seed when stored state is from an older layout
      if (rawRooms.length < seedRest.rooms.length) {
        return seedRest.rooms.map((r) => ({ ...r }))
      }
      return rawRooms.map((r, i) => ({
        ...seedRest.rooms[i % seedRest.rooms.length]!,
        ...r,
        x: r.x ?? seedRest.rooms.find((s) => s.id === r.id)?.x ?? i * 14,
        y: r.y ?? seedRest.rooms.find((s) => s.id === r.id)?.y ?? 0,
      }))
    })(),
    patients: (raw.patients ?? seedRest.patients).map((p) => {
      const seedMatch = seedRest.patients.find((s) => s.id === p.id)
      return {
        ...emptyPatientProfile(),
        ...seedMatch,
        ...p,
        vitals: {
          ...emptyVitals(),
          ...seedMatch?.vitals,
          ...p.vitals,
        },
        history: p.history ?? seedMatch?.history ?? [],
        carePhase: p.carePhase ?? seedMatch?.carePhase ?? 'awaiting_exam',
        acuity: p.acuity ?? seedMatch?.acuity ?? 'routine',
        chartIncomplete: p.chartIncomplete ?? seedMatch?.chartIncomplete ?? false,
        simulationStage:
          p.simulationStage ??
          (!p.roomId
            ? 'waiting'
            : p.carePhase === 'awaiting_vitals'
              ? 'roomed'
              : p.carePhase === 'awaiting_exam'
                ? 'awaiting_exam'
                : 'ready_for_discharge'),
        lifecycleUpdatedAt: p.lifecycleUpdatedAt ?? p.statusUpdatedAt ?? p.admittedAt,
        lifecyclePaused: p.lifecyclePaused ?? false,
      }
    }),
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
    agentAssignEnabled: raw.agentAssignEnabled ?? true,
    agentAssignmentNotBefore:
      raw.agentAssignmentNotBefore ?? Date.now() + 2_000,
    lastAgentTickAt: raw.lastAgentTickAt ?? new Date().toISOString(),
    nextSimulationAt: raw.nextSimulationAt ?? Date.now() + 4_000,
    version: raw.version ?? 1,
  }
  return {
    ...migrated,
    rooms: roomStatusFromPatients(migrated.rooms, migrated.patients),
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
  const sharedVersionRef = useRef(shared.version)
  sharedVersionRef.current = shared.version

  const state: ClinicState = useMemo(
    () => ({ ...shared, viewingAs }),
    [shared, viewingAs],
  )

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel
    channel.onmessage = (event: MessageEvent<SharedState>) => {
      if (!event.data?.version || event.data.version <= sharedVersionRef.current) return
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
    if (action.type === 'RESET_DEMO') {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
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
