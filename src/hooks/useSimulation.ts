import { useEffect, useReducer, type Dispatch } from 'react'
import { createInitialState } from '../state/initialState'
import { simulationReducer } from '../state/reducer'
import type { SimulationAction, SimulationState } from '../state/types'

export function useSimulation(): [SimulationState, Dispatch<SimulationAction>] {
  const [state, dispatch] = useReducer(simulationReducer, undefined, createInitialState)

  useEffect(() => {
    if (!state.isRunning) return
    const id = setInterval(() => {
      dispatch({ type: 'TICK' })
    }, state.tickRateMs)
    return () => clearInterval(id)
  }, [state.isRunning, state.tickRateMs])

  return [state, dispatch]
}
