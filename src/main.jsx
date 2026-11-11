import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Las rutas van en el hash (#/paciente). Si alguien abre /paciente o /asistente, se pasa al hash.
const ruta = window.location.pathname.replace(/\/+$/, '');
if (ruta && ruta !== '/index.html' && !window.location.hash) {
  window.history.replaceState(null, '', `/#${ruta}${window.location.search}`);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
