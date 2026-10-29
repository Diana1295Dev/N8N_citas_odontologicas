import { marcarTomada, registrarCita } from '../data/disponibilidad.mock.js';
import { USA_MOCK } from './disponibilidad.js';

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || '';

export class ErrorEnvio extends Error {
  constructor(codigo) {
    super(codigo);
    this.codigo = codigo; // 'slot_taken' | 'red' (sin internet) | 'servidor' (el webhook no recibió la cita)
  }
}

// En modo demo, abrir la página con ?slot_taken=1 hace que el primer envío falle con slot_taken.
let fallaPendiente =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('slot_taken');

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function enviarMock(payload) {
  await pausa(700);
  if (fallaPendiente) {
    fallaPendiente = false;
    marcarTomada(payload.fecha, payload.hora, payload.duracion_min);
    throw new ErrorEnvio('slot_taken');
  }
  registrarCita(payload);
}

/** POST a VITE_WEBHOOK_URL. El servidor indica una hora ocupada con HTTP 409 o { error: "slot_taken" }. */
export async function enviarCita(payload) {
  if (!WEBHOOK_URL) return enviarMock(payload);

  let res;
  try {
    res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ErrorEnvio('red');
  }
  let cuerpo = null;
  try {
    cuerpo = await res.json();
  } catch {
    /* la respuesta puede venir vacía */
  }
  const codigo = cuerpo && (cuerpo.error || cuerpo.status);
  if (res.status === 409 || codigo === 'slot_taken') throw new ErrorEnvio('slot_taken');
  if (!res.ok) {
    if (import.meta.env.DEV && res.status === 404 && WEBHOOK_URL.includes('/webhook-test/')) {
      console.warn('[citas] n8n respondió 404: la Test URL solo escucha tras pulsar "Execute workflow" (y para una sola petición). Pulsa el botón o usa la Production URL (/webhook/...).');
    }
    throw new ErrorEnvio('servidor');
  }
  // Mientras la disponibilidad salga del mock, la cita aceptada también se aparta aquí para que su hora deje de ofrecerse.
  // Con VITE_API_BASE, la API ya descuenta sus citas.
  if (USA_MOCK) registrarCita(payload);
}
