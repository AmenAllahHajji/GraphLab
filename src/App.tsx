import { GraphProvider } from './features/graph/state/GraphProvider'
import { GraphWorkspace } from './features/workspace/components/GraphWorkspace'
import { ShortcutProvider } from './shared/context/ShortcutContext'

function App() {
  return (
    <ShortcutProvider>
      <GraphProvider>
        <GraphWorkspace />
      </GraphProvider>
    </ShortcutProvider>
  )
}

export default App
