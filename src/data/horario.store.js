// Agenda de la ortodoncista, que la asistente configura desde su panel: bloques [inicio, fin] en minutos por fecha.
// Por ahora vive en localStorage; cuando haya API real este archivo se reemplaza por llamadas a ella.
// Mientras la asistente no guarde nada se usa una plantilla semanal de ejemplo (mar y jue 8-12 y 14-17, sáb 8-11).

import { addDays } from '../lib/fechas.js';

const CLAVE = 'citas.agenda.v2';
const MANANA_Y_TARDE = [[480, 720], [840, 1020]];
const PLANTILLA = { 2: MANANA_Y_TARDE, 4: MANANA_Y_TARDE, 6: [[480, 660]] }; // día JS: 2 martes ... 6 sábado

const clonar = (o) => JSON.parse(JSON.stringify(o));
const esFecha = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const diaJS = (fecha) => new Date(`${fecha}T00:00:00Z`).getUTCDay();

function normalizar(dias) {
  const out = {};
  for (const [fecha, lista] of Object.entries(dias || {})) {
    if (!esFecha(fecha) || !Array.isArray(lista)) continue;
    const bloques = lista
      .filter((b) => Array.isArray(b) && Number.isFinite(b[0]) && Number.isFinite(b[1]) && b[1] > b[0])
      .map((b) => [b[0], b[1]])
      .sort((a, b) => a[0] - b[0]);
    if (bloques.length) out[fecha] = bloques;
  }
  return out;
}

let cargado = false;
let personalizado = false;
let dias = {};
let estados = {}; // marcas por fecha: solo 'no_atiende' («Sin cupo» lo calculan las reservas)

function normalizarEstados(e) {
  const out = {};
  for (const [fecha, v] of Object.entries(e || {})) {
    if (esFecha(fecha) && v === 'no_atiende') out[fecha] = v;
  }
  return out;
}

function cargar() {
  if (cargado) return;
  cargado = true;
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(CLAVE);
    if (raw) {
      const datos = JSON.parse(raw);
      dias = normalizar(datos.dias);
      estados = normalizarEstados(datos.estados);
      personalizado = true;
    }
  } catch {
    /* almacenamiento no disponible o dañado: se usa la plantilla */
  }
}

/** true cuando la asistente ya guardó su propia agenda (deja de simularse ocupación al azar). */
export function horarioPersonalizado() {
  cargar();
  return personalizado;
}

/** Bloques de atención de una fecha "AAAA-MM-DD". */
export function bloquesDeFecha(fecha) {
  cargar();
  return personalizado ? dias[fecha] || [] : PLANTILLA[diaJS(fecha)] || [];
}

/** Marca puesta por la asistente a una fecha ('no_atiende'), o null. */
export function estadoDeFecha(fecha) {
  cargar();
  return personalizado ? estados[fecha] || null : null;
}

/** Copia editable de la agenda; si es la de ejemplo, se expande entre `desde` y `hasta`. */
export function copiaAgenda(desde, hasta) {
  cargar();
  if (personalizado) return clonar(dias);
  const out = {};
  for (let f = desde; f <= hasta; f = addDays(f, 1)) {
    const b = PLANTILLA[diaJS(f)];
    if (b) out[f] = clonar(b);
  }
  return out;
}

export function guardarAgenda(nuevos, marcas = {}) {
  cargar();
  dias = normalizar(nuevos);
  estados = normalizarEstados(marcas);
  personalizado = true;
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ dias, estados }));
  } catch {
    /* sin almacenamiento: queda solo en memoria */
  }
}

export function restablecerAgenda() {
  cargar();
  dias = {};
  estados = {};
  personalizado = false;
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* nada que borrar */
  }
}

/** Mensaje de error de los bloques de un día, o '' si son válidos. */
export function errorBloques(bloques) {
  const orden = [...bloques].sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < orden.length; i++) {
    if (orden[i][1] <= orden[i][0]) return 'La hora de fin debe ser posterior a la de inicio.';
    if (i > 0 && orden[i][0] < orden[i - 1][1]) return 'Los bloques no pueden cruzarse.';
  }
  return '';
}

export const minutosTotales = (bloques) => bloques.reduce((s, [a, b]) => s + (b - a), 0);
