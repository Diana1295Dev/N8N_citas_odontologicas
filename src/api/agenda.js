import { API_BASE } from './disponibilidad.js';

// Panel de la asistente contra la API de n8n (flujo 2_PANEL_ASISTENTE). Solo se usa cuando hay VITE_API_BASE.

async function pedir(ruta, opciones = {}) {
  const res = await fetch(`${API_BASE}/${ruta}`, {
    ...opciones,
    headers: { Accept: 'application/json', ...(opciones.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  if (!res.ok) throw new Error(`${ruta}_http_${res.status}`);
  return res.json();
}

/** Horario habitual y días sin atención: { patron, marcas: { no_atiende } }. */
export async function leerHorario() {
  const data = await pedir('horario');
  if (!data?.patron) throw new Error('horario_formato');
  return { patron: data.patron, marcas: { no_atiende: data.marcas?.no_atiende || [] } };
}

export const guardarHorario = (patron, marcas) =>
  pedir('horario', { method: 'POST', body: JSON.stringify({ patron, marcas }) });

/** Citas activas (sin las canceladas), ordenadas por fecha y hora. */
export async function leerCitas() {
  const data = await pedir('citas');
  return (data?.citas || []).filter((c) => c.estado !== 'Cancelada');
}

export const cancelarCita = (id) => pedir('cancelar-cita', { method: 'POST', body: JSON.stringify({ id }) });
