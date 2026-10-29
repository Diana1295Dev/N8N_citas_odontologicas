import { OFFSET_BOGOTA_H } from '../config.js';

// Todas las fechas se manejan como texto "AAAA-MM-DD"; los cálculos usan UTC para
// no depender de la zona horaria del navegador.

const DIA_MS = 86400000;

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const parseISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
export const toISO = (dt) => dt.toISOString().slice(0, 10);
export const addDays = (iso, n) => toISO(new Date(parseISO(iso).getTime() + n * DIA_MS));
export const esFechaISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && toISO(parseISO(s)) === s;

/** Lunes de la semana a la que pertenece la fecha (domingo cuenta con la semana que termina). */
export const lunesDe = (iso) => addDays(iso, -((parseISO(iso).getUTCDay() + 6) % 7));

/** Índice 0-5 (lunes-sábado); 6 para domingo. */
export const indiceDia = (iso) => (parseISO(iso).getUTCDay() + 6) % 7;

/** Fecha y minutos del día "ahora" en Bogotá. `ms` permite inyectar la hora en pruebas. */
export function ahoraBogota(ms = Date.now()) {
  const d = new Date(ms - OFFSET_BOGOTA_H * 3600000);
  return { fecha: toISO(d), minutos: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

/** Lunes de la semana en curso; si hoy es domingo no queda nada que agendar, así que es el lunes siguiente. */
export function semanaActual(fechaHoy) {
  return parseISO(fechaHoy).getUTCDay() === 0 ? addDays(fechaHoy, 1) : lunesDe(fechaHoy);
}

export function rangoSemanas(ahora, semanasMax = 8) {
  const min = semanaActual(ahora.fecha);
  return { min, max: addDays(min, 7 * (semanasMax - 1)) };
}

export const semanasEntre = (a, b) => Math.round((parseISO(b) - parseISO(a)) / (7 * DIA_MS));

/** "3 al 8 de noviembre", "30 de noviembre al 5 de diciembre", con año si cruza de año. */
export function formatRango(inicio) {
  const a = parseISO(inicio);
  const b = parseISO(addDays(inicio, 5));
  const [da, ma, ya] = [a.getUTCDate(), a.getUTCMonth(), a.getUTCFullYear()];
  const [db, mb, yb] = [b.getUTCDate(), b.getUTCMonth(), b.getUTCFullYear()];
  if (ya !== yb) return `${da} de ${MESES[ma]} de ${ya} al ${db} de ${MESES[mb]} de ${yb}`;
  if (ma !== mb) return `${da} de ${MESES[ma]} al ${db} de ${MESES[mb]}`;
  return `${da} al ${db} de ${MESES[ma]}`;
}

export function partesFecha(iso) {
  const d = parseISO(iso);
  const idx = (d.getUTCDay() + 6) % 7;
  return {
    dia: d.getUTCDate(),
    mes: MESES[d.getUTCMonth()],
    anio: d.getUTCFullYear(),
    nombreDia: DIAS[idx] || 'domingo',
    nombreCorto: DIAS_CORTOS[idx] || 'Dom',
  };
}

export const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const fechaLarga = (iso) => {
  const p = partesFecha(iso);
  return `${capitalizar(p.nombreDia)} ${p.dia} de ${p.mes}`;
};

export const horaAMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const minAHora = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** "14:30" -> "2:30 p. m." */
export function hora12(hhmm) {
  const min = horaAMin(hhmm);
  const h = Math.floor(min / 60);
  const m = String(min % 60).padStart(2, '0');
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}
