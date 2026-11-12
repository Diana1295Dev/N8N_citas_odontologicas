import { useEffect, useState } from 'react';
import { getDisponibilidad, USA_MOCK } from '../api/disponibilidad.js';
import { addDays } from '../lib/fechas.js';

// Caché en memoria por servicio y semana, con deduplicación de peticiones en curso.
const cache = new Map();
const enCurso = new Map();
const clave = (servicio, semana) => `${servicio}|${semana}`;

export const leerCache = (servicio, semana) => cache.get(clave(servicio, semana)) || null;
export const limpiarCache = () => cache.clear();

export function cargarSemana(servicio, semana, { forzar = false } = {}) {
  const k = clave(servicio, semana);
  if (!forzar && cache.has(k)) return Promise.resolve(cache.get(k));
  if (!forzar && enCurso.has(k)) return enCurso.get(k);
  const p = getDisponibilidad({ semana, servicio })
    .then((data) => {
      cache.set(k, data);
      return data;
    })
    .finally(() => enCurso.delete(k));
  enCurso.set(k, p);
  return p;
}

export const hayCupo = (data) => data.dias.some((d) => d.slots.length > 0);

/** Primera semana (entre `desde` y `hasta`) con algún cupo, o null. */
export async function buscarPrimerCupo(servicio, desde, hasta) {
  for (let s = desde; s <= hasta; s = addDays(s, 7)) {
    const data = await cargarSemana(servicio, s);
    if (hayCupo(data)) return s;
  }
  return null;
}

export function useSemana(servicio, semana) {
  const key = clave(servicio, semana);
  const [res, setRes] = useState({ key: null });
  const [forzar, setForzar] = useState({ key: '', n: 0 });

  useEffect(() => {
    let vivo = true;
    const reintento = forzar.key === key && forzar.n > 0;
    const enCache = reintento ? null : leerCache(servicio, semana);
    // Con la API real, otras pacientes pueden reservar mientras esta mira: se muestra lo guardado
    // y se vuelve a preguntar en silencio, también al regresar a la página.
    const refrescar = () => {
      if (USA_MOCK) return;
      cargarSemana(servicio, semana, { forzar: true })
        .then((data) => vivo && setRes({ key, status: 'ok', data }))
        .catch(() => { /* se queda con lo que ya mostraba */ });
    };
    const alVolver = () => { if (document.visibilityState === 'visible') refrescar(); };
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('focus', refrescar);
    if (enCache) {
      setRes({ key, status: 'ok', data: enCache });
      refrescar();
    } else {
      setRes({ key, status: 'loading' });
      cargarSemana(servicio, semana, { forzar: reintento })
        .then((data) => vivo && setRes({ key, status: 'ok', data }))
        .catch(() => vivo && setRes({ key, status: 'error' }));
    }
    return () => {
      vivo = false;
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('focus', refrescar);
    };
  }, [key, forzar]); // eslint-disable-line react-hooks/exhaustive-deps

  const actual = res.key === key ? res : { status: 'loading' };
  return { ...actual, recargar: () => setForzar((f) => ({ key, n: f.n + 1 })) };
}
