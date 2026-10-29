import { BLOQUE_MIN, PROFESIONAL, SEMANAS_MAX, servicioPorId } from '../config.js';
import {
  addDays, ahoraBogota, esFechaISO, lunesDe, minAHora, semanaActual, semanasEntre,
} from '../lib/fechas.js';
import { filtrarAnticipacion, slotsConsecutivos } from '../lib/slots.js';
import { bloquesDeFecha, estadoDeFecha, horarioPersonalizado } from './horario.store.js';
import { agregarReserva, bloquesTomados, reservasDe } from './reservas.store.js';

// Los bloques de atención los define la asistente en su calendario (ver horario.store.js).
// Los ocupados salen de las citas reservadas (reservas.store.js): cuando no queda hueco, el día es «Sin cupo».

const SEMANA_VACIA = 3; // la 4.ª semana (desde la actual) no tiene ningún cupo
const PROB_OCUPADO = 30; // % de bloques ocupados

function hash(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100;
}

function bloquesDelDia(fecha) {
  const bloques = [];
  for (const [ini, fin] of bloquesDeFecha(fecha)) for (let m = ini; m < fin; m += BLOQUE_MIN) bloques.push(m);
  return bloques;
}

// Con la agenda de ejemplo se simula ocupación al azar; con la agenda de la asistente solo cuentan las citas reservadas.
const ocupadoAlAzar = (fecha, min, demo) => demo && hash(`${fecha}|${min}`) < PROB_OCUPADO;

/** Aparta una hora sin datos de paciente (hora "HH:MM", duración en minutos). */
export function marcarTomada(fecha, hhmm, duracionMin) {
  agregarReserva({ fecha, hora: hhmm, duracion_min: duracionMin });
}

/** Registra una cita confirmada con los datos de la paciente: sus bloques dejan de ofrecerse y aparece en el tablero. */
export const registrarCita = (cita) => agregarReserva(cita);

/** Ocupación de un día de la agenda: citas reservadas y si ya no queda ningún bloque libre. */
export function ocupacionDe(fecha) {
  const bloques = bloquesDelDia(fecha);
  const tomados = bloquesTomados(fecha);
  return { citas: reservasDe(fecha).length, lleno: bloques.length > 0 && bloques.every((m) => tomados.has(m)) };
}

/** Respuesta sin latencia, con "ahora" inyectable para poder probar la lógica. */
export function generarDisponibilidad({ semana, servicio }, { ahoraMs } = {}) {
  const srv = servicioPorId(servicio);
  if (!srv) throw new Error('servicio_invalido');
  if (!esFechaISO(semana)) throw new Error('semana_invalida');

  const ahora = ahoraBogota(ahoraMs);
  const lunes = lunesDe(semana);
  const offset = semanasEntre(semanaActual(ahora.fecha), lunes);
  const demo = !horarioPersonalizado();
  const ofrece = offset >= 0 && offset < SEMANAS_MAX && !(demo && offset === SEMANA_VACIA);

  const dias = Array.from({ length: 6 }, (_, i) => {
    const fecha = addDays(lunes, i);
    // motivo (solo cuando no hay horas): 'pasado' | 'no_atiende' (la ortodoncista no trabaja ese día) | 'sin_cupo' (atiende, pero todo tomado)
    if (fecha < ahora.fecha) return { fecha, slots: [], motivo: 'pasado' };
    if (!ofrece) return { fecha, slots: [], motivo: 'no_atiende' };
    // La asistente solo marca «No atiende»; gana sobre el horario.
    if (estadoDeFecha(fecha)) return { fecha, slots: [], motivo: 'no_atiende' };
    const bloques = bloquesDelDia(fecha);
    if (!bloques.length) return { fecha, slots: [], motivo: 'no_atiende' };

    const tomados = bloquesTomados(fecha);
    const libres = bloques.filter((m) => !tomados.has(m) && !ocupadoAlAzar(fecha, m, demo));
    const cabe = slotsConsecutivos(libres, srv.duracion_min);
    const slots = filtrarAnticipacion(fecha, cabe, ahora).map(minAHora);
    if (slots.length) return { fecha, slots };
    // Hoy, lo que queda libre ya empieza demasiado pronto: para la paciente ese día "ya pasó".
    return { fecha, slots: [], motivo: cabe.length && fecha === ahora.fecha ? 'pasado' : 'sin_cupo' };
  });

  return {
    semana_inicio: lunes,
    semana_fin: addDays(lunes, 5),
    profesional: PROFESIONAL,
    duracion_min: srv.duracion_min,
    dias,
  };
}

export function getDisponibilidadMock(params) {
  const latencia = 500 + Math.random() * 400;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(generarDisponibilidad(params));
      } catch (e) {
        reject(e);
      }
    }, latencia);
  });
}
