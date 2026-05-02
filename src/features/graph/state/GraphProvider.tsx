import {
  type PropsWithChildren,
  useReducer,
  useEffect,
} from 'react'
import { initialDocument } from '../model/defaults'
import {
  GraphDispatchContext,
  GraphHistoryContext,
  GraphStateContext,
} from './GraphContext'
import { historyReducer } from './historyReducer'

const STORAGE_KEY = 'graphlab_workspace_state'

function loadPersistedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load persisted state', e)
  }
  return initialDocument
}

export function GraphProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(historyReducer, {
    past: [],
    present: loadPersistedState(),
    future: [],
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.present))
  }, [state.present])

  return (
    <GraphHistoryContext.Provider value={state}>
      <GraphStateContext.Provider value={state.present}>
        <GraphDispatchContext.Provider value={dispatch}>
          {children}
        </GraphDispatchContext.Provider>
      </GraphStateContext.Provider>
    </GraphHistoryContext.Provider>
  )
}


