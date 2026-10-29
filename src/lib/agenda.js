import { errorBloques } from '../data/horario.store.js';
import { addDays, indiceDia, lunesDe } from './fechas.js';

// Lo que diligencia la asistente: qué días atiende (0 = lunes ... 5 = sábado), jornada de mañana y de tarde,
// y los días o semanas en que la doctora no atiende. «Sin cupo» no se marca aquí: lo dan las reservas.
// De ahí se compone la agenda por fecha que consume el mock/API.

export const PATRON_VACIO = {
  dias: [],
  manana: { on: true, ini: 480, fin: 720 },
  tarde: { on: true, ini: 840, fin: 1020 },
};
export const MARCAS_VACIAS = { no_atiende: [] };

export const periodosDe = (p) => [p.manana, p.tarde].filter((x) => x.on).map((x) => [x.ini, x.fin]);

/** Mensaje de error del horario, o '' si es válido. */
export function errorPatron(p) {
  const per = periodosDe(p);
  return per.length ? errorBloques(per) : 'Marca la mañana, la tarde o las dos.';
}

const atiendeEn = (patron, f) => indiceDia(f) <= 5 && patron.dias.includes(indiceDia(f));
export const noAtiende = (marcas, f) => marcas.no_atiende.includes(f);

/** Agenda por fecha: solo los días que atiende y no están marcados como «No atiende». */
export function componerAgenda(patron, marcas, desde, hasta) {
  const periodos = periodosDe(patron);
  const out = {};
  for (let f = desde; f <= hasta; f = addDays(f, 1)) {
    if (atiendeEn(patron, f) && !noAtiende(marcas, f)) out[f] = periodos.map((b) => [...b]);
  }
  return out;
}

/** Marcas por fecha ({ fecha: 'no_atiende' }) de los días que atiende. */
export function componerMarcas(patron, marcas, desde, hasta) {
  const out = {};
  for (let f = desde; f <= hasta; f = addDays(f, 1)) {
    if (atiendeEn(patron, f) && noAtiende(marcas, f)) out[f] = 'no_atiende';
  }
  return out;
}

/** Pone o quita «No atiende» en una fecha. */
export function alternarDia(marcas, fecha) {
  const lista = marcas.no_atiende;
  return { no_atiende: lista.includes(fecha) ? lista.filter((x) => x !== fecha) : [...lista, fecha].sort() };
}

/** Fechas (lunes a sábado) de la semana de `fecha` en que atiende y que caen dentro de la ventana. */
export function diasDeSemana(patron, fecha, desde, hasta) {
  const lunes = lunesDe(fecha);
  return Array.from({ length: 6 }, (_, i) => addDays(lunes, i)).filter((f) => f >= desde && f <= hasta && atiendeEn(patron, f));
}

/** Marca «No atiende» en toda una semana, o la desmarca si ya estaba completa. */
export function alternarSemana(marcas, fechas) {
  const todas = fechas.length > 0 && fechas.every((f) => marcas.no_atiende.includes(f));
  const resto = marcas.no_atiende.filter((x) => !fechas.includes(x));
  return { no_atiende: todas ? resto : [...resto, ...fechas].sort() };
}
