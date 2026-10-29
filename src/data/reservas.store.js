// Citas reservadas por las pacientes. De aquí salen el «Sin cupo» y el tablero de la asistente.
// Vive en localStorage hasta que exista la API (modo demo: solo se ven las citas hechas en este navegador);
// entonces el servidor responde la disponibilidad y la lista de citas, y este archivo se reemplaza.

import { BLOQUE_MIN } from '../config.js';
import { horaAMin } from '../lib/fechas.js';

export const CLAVE_RESERVAS = 'citas.reservas.v1';

let cargado = false;
let lista = []; // [{ id, fecha, hora, duracion_min, nombre?, telefono?, email?, servicio?, servicio_nombre?, notas?, creada_en }]

function cargar() {
  if (cargado) return;
  cargado = true;
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(CLAVE_RESERVAS);
    const datos = raw ? JSON.parse(raw) : [];
    lista = Array.isArray(datos) ? datos.filter((r) => r && r.fecha && r.hora && r.duracion_min > 0) : [];
    lista.forEach((r, i) => { r.id ||= `r${i}-${r.fecha}-${r.hora}`; });
  } catch {
    lista = [];
  }
}

function persistir() {
  try {
    localStorage.setItem(CLAVE_RESERVAS, JSON.stringify(lista));
  } catch {
    /* sin almacenamiento: queda solo en memoria */
  }
}

const nuevoId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Guarda una cita. Basta con fecha, hora y duración; los datos de la paciente son opcionales. */
export function agregarReserva(cita) {
  cargar();
  const { fecha, hora, duracion_min, nombre, telefono, email, servicio, servicio_nombre, notas } = cita;
  lista.push({ id: nuevoId(), fecha, hora, duracion_min, nombre, telefono, email, servicio, servicio_nombre, notas, creada_en: new Date().toISOString() });
  persistir();
}

/** Todas las citas, ordenadas por fecha y hora. */
export function todasLasReservas() {
  cargar();
  return [...lista].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
}

export function reservasDe(fecha) {
  cargar();
  return lista.filter((r) => r.fecha === fecha);
}

/** Cancela una cita: su hora vuelve a quedar libre para las pacientes. */
export function cancelarReserva(id) {
  cargar();
  lista = lista.filter((r) => r.id !== id);
  persistir();
}

/** Vuelve a leer del almacenamiento (p. ej. si otra pestaña reservó). */
export function recargarReservas() {
  cargado = false;
  cargar();
}

/** Minutos de inicio de cada bloque ocupado en la fecha. */
export function bloquesTomados(fecha) {
  const out = new Set();
  for (const r of reservasDe(fecha)) {
    const ini = horaAMin(r.hora);
    for (let t = ini; t < ini + r.duracion_min; t += BLOQUE_MIN) out.add(t);
  }
  return out;
}

export function borrarReservas() {
  cargar();
  lista = [];
  try {
    localStorage.removeItem(CLAVE_RESERVAS);
  } catch {
    /* nada que borrar */
  }
}
