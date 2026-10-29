import { ANTICIPACION_MIN, BLOQUE_MIN } from '../config.js';

export const bloquesNecesarios = (duracionMin, bloque = BLOQUE_MIN) =>
  Math.ceil(duracionMin / bloque);

/**
 * Inicios (en minutos) desde los que caben `duracionMin` minutos en bloques libres consecutivos.
 * `libres` son los inicios de los bloques libres; un hueco (almuerzo, bloque ocupado) corta la cadena.
 */
export function slotsConsecutivos(libres, duracionMin, bloque = BLOQUE_MIN) {
  const set = new Set(libres);
  const n = bloquesNecesarios(duracionMin, bloque);
  return [...set]
    .sort((a, b) => a - b)
    .filter((ini) => {
      for (let i = 1; i < n; i++) if (!set.has(ini + i * bloque)) return false;
      return true;
    });
}

/** Quita lo pasado y lo que empieza con menos de `anticipacion` minutos respecto a "ahora" (Bogotá). */
export function filtrarAnticipacion(fecha, minutos, ahora, anticipacion = ANTICIPACION_MIN) {
  if (fecha < ahora.fecha) return [];
  if (fecha > ahora.fecha) return minutos;
  return minutos.filter((m) => m >= ahora.minutos + anticipacion);
}
