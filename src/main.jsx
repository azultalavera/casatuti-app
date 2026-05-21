import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registro de Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('🔌 [PWA] Service Worker registrado con éxito en el ámbito:', reg.scope);
      })
      .catch(err => {
        console.error('❌ [PWA] Error al registrar el Service Worker:', err);
      });
  });
}
