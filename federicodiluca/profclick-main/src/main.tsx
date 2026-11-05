import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Prima di React: il browser può offrire l'installazione appena la pagina si apre.
import '@/state/install'
import App from '@/app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
