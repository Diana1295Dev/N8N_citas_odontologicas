import { getDisponibilidadMock } from '../data/disponibilidad.mock.js';

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

/** true cuando no hay API configurada y se muestran datos de ejemplo. */
export const USA_MOCK = !API_BASE;

/**
 * Disponibilidad de una semana.
 * @returns {Promise<{semana_inicio:string, semana_fin:string, profesional:string,
 *   duracion_min:number, dias:{fecha:string, slots:string[]}[]}>}
 */
export async function getDisponibilidad({ semana, servicio }) {
  if (USA_MOCK) return getDisponibilidadMock({ semana, servicio });

  const qs = new URLSearchParams({ semana, servicio });
  const res = await fetch(`${API_BASE}/disponibilidad?${qs}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`disponibilidad_http_${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.dias)) throw new Error('disponibilidad_formato');
  return data;
}
