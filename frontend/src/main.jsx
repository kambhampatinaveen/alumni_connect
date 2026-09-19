import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Clear stale mock cache so the real backend data loads fresh
if (!localStorage.getItem('alumniconnect_cache_v2')) {
  localStorage.removeItem('alumniconnect_db');
  localStorage.setItem('alumniconnect_cache_v2', '1');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
