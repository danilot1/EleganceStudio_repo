import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { SetupRequired } from './components/SetupRequired'
import { isFirebaseConfigured, missingFirebaseVars } from './lib/firebase'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root não encontrado em index.html')

createRoot(container).render(
  <StrictMode>
    {isFirebaseConfigured ? (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    ) : (
      <SetupRequired missing={missingFirebaseVars} />
    )}
  </StrictMode>,
)
