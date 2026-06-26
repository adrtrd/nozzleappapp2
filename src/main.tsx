import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PrintProvider } from './components/PrintProvider'

// Main app root
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Separate root for print — lives outside #root for clean print isolation
createRoot(document.getElementById('PRINT_PORTAL')!).render(
  <StrictMode>
    <PrintProvider />
  </StrictMode>,
)
