// Lo que diligencia la asistente (días + horario + marcas) se compone en la agenda por fecha.
import assert from 'node:assert/strict';
import { generarDisponibilidad, marcarTomada, ocupacionDe, registrarCita } from '../src/data/disponibilidad.mock.js';
import { cancelarReserva, todasLasReservas } from '../src/data/reservas.store.js';
import { guardarAgenda, restablecerAgenda } from '../src/data/horario.store.js';
import {
  alternarDia, alternarSemana, componerAgenda, componerMarcas, diasDeSemana, errorPatron, MARCAS_VACIAS, PATRON_VACIO,
} from '../src/lib/agenda.js';

let n = 0;
const prueba = (nombre, fn) => {
  fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};
const patron = { ...PATRON_VACIO, dias: [1, 3] }; // martes y jueves, 8-12 y 14-17
const marcas = (no_atiende = []) => ({ no_atiende });
const ahoraMs = Date.UTC(2026, 9, 26, 12, 0); // lunes 26-oct-2026, 07:00 Bogotá

console.log('Asistente: días + horario');
prueba('solo se agendan los días marcados, con mañana y tarde', () => {
  const a = componerAgenda(patron, MARCAS_VACIAS, '2026-11-02', '2026-11-08');
  assert.deepEqual(Object.keys(a), ['2026-11-03', '2026-11-05']);
  assert.deepEqual(a['2026-11-03'], [[480, 720], [840, 1020]]);
});
prueba('solo mañana, solo tarde', () => {
  const m = componerAgenda({ ...patron, tarde: { ...patron.tarde, on: false } }, MARCAS_VACIAS, '2026-11-03', '2026-11-03');
  assert.deepEqual(m['2026-11-03'], [[480, 720]]);
  const t = componerAgenda({ ...patron, manana: { ...patron.manana, on: false } }, MARCAS_VACIAS, '2026-11-03', '2026-11-03');
  assert.deepEqual(t['2026-11-03'], [[840, 1020]]);
});
prueba('el domingo nunca se agenda y respeta el rango', () => {
  const a = componerAgenda({ ...patron, dias: [0, 1, 2, 3, 4, 5] }, MARCAS_VACIAS, '2026-11-01', '2026-11-08');
  assert.ok(!('2026-11-01' in a) && !('2026-11-08' in a), 'domingos fuera');
  assert.equal(Object.keys(a).length, 6);
});
prueba('validación del horario', () => {
  assert.equal(errorPatron(patron), '');
  assert.match(errorPatron({ ...patron, manana: { on: true, ini: 720, fin: 600 } }), /posterior/);
  assert.match(errorPatron({ ...patron, manana: { on: true, ini: 480, fin: 900 } }), /cruzarse/);
  assert.match(errorPatron({ ...patron, manana: { ...patron.manana, on: false }, tarde: { ...patron.tarde, on: false } }), /Marca/);
});

console.log('Asistente: solo marca «No atiende»');
prueba('un día marcado sale de la agenda y queda como «No atiende»', () => {
  const mk = marcas(['2026-11-03']);
  assert.deepEqual(Object.keys(componerAgenda(patron, mk, '2026-11-02', '2026-11-08')), ['2026-11-05']);
  assert.deepEqual(componerMarcas(patron, mk, '2026-11-02', '2026-11-08'), { '2026-11-03': 'no_atiende' });
});
prueba('tocar un día lo marca y tocarlo otra vez lo quita', () => {
  const mk = alternarDia(MARCAS_VACIAS, '2026-11-03');
  assert.deepEqual(mk, marcas(['2026-11-03']));
  assert.deepEqual(alternarDia(mk, '2026-11-03'), MARCAS_VACIAS);
});
prueba('"Toda" marca la semana (solo los días que atiende) y otro toque la quita', () => {
  const fechas = diasDeSemana(patron, '2026-11-04', '2026-10-29', '2026-12-19'); // semana del 2 al 7
  assert.deepEqual(fechas, ['2026-11-03', '2026-11-05']);
  const mk = alternarSemana(MARCAS_VACIAS, fechas);
  assert.deepEqual(mk, marcas(['2026-11-03', '2026-11-05']));
  assert.deepEqual(alternarSemana(mk, fechas), MARCAS_VACIAS);
  // con un día suelto ya marcado, "Toda" completa la semana
  assert.deepEqual(alternarSemana(marcas(['2026-11-03']), fechas), mk);
});
prueba('la semana respeta la ventana (no marca días pasados)', () => {
  const fechas = diasDeSemana(patron, '2026-10-29', '2026-10-29', '2026-12-19'); // semana del 26 al 31
  assert.deepEqual(fechas, ['2026-10-29'], 'el martes 27 ya pasó');
});
prueba('una marca «sin_cupo» guardada a mano ya no se respeta', () => {
  guardarAgenda(componerAgenda(patron, MARCAS_VACIAS, '2026-10-26', '2026-11-30'), { '2026-11-05': 'sin_cupo' });
  const r = generarDisponibilidad({ semana: '2026-11-02', servicio: 'limpieza' }, { ahoraMs });
  assert.equal(r.dias[3].slots.length, 14, 'el jueves sigue con todas sus horas');
});

console.log('«Sin cupo» automático según las reservas');
prueba('cada cita quita sus horas y el día se llena solo', () => {
  guardarAgenda(componerAgenda(patron, MARCAS_VACIAS, '2026-10-26', '2026-11-30'));
  const dia = '2026-11-12'; // jueves: 8-12 y 14-17 = 14 bloques
  marcarTomada(dia, '08:00', 60);
  let r = generarDisponibilidad({ semana: '2026-11-09', servicio: 'limpieza' }, { ahoraMs });
  assert.equal(r.dias[3].slots.length, 12);
  assert.ok(!r.dias[3].slots.includes('08:00') && !r.dias[3].slots.includes('08:30'));
  assert.deepEqual(ocupacionDe(dia), { citas: 1, lleno: false });
  for (const h of ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']) marcarTomada(dia, h, 60);
  r = generarDisponibilidad({ semana: '2026-11-09', servicio: 'limpieza' }, { ahoraMs });
  assert.deepEqual([r.dias[3].slots, r.dias[3].motivo], [[], 'sin_cupo']);
  assert.deepEqual(ocupacionDe(dia), { citas: 7, lleno: true });
  assert.equal(r.dias[1].slots.length, 14, 'el martes no se afecta');
});
prueba('si solo quedan huecos de 30 min, un servicio de 60 min ve «Sin cupo» y uno de 30 no', () => {
  const dia = '2026-11-19';
  for (const h of ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00']) marcarTomada(dia, h, 30);
  const largo = generarDisponibilidad({ semana: '2026-11-16', servicio: 'blanqueamiento' }, { ahoraMs });
  const corto = generarDisponibilidad({ semana: '2026-11-16', servicio: 'limpieza' }, { ahoraMs });
  assert.equal(largo.dias[3].motivo, 'sin_cupo');
  assert.equal(corto.dias[3].slots.length, 7);
  assert.equal(ocupacionDe(dia).lleno, false, 'para la asistente aún no está lleno');
});
prueba('el tablero recibe la cita con sus datos y cancelarla libera la hora', () => {
  const dia = '2026-11-24';
  registrarCita({ fecha: dia, hora: '09:00', duracion_min: 45, nombre: 'Ana Pérez', telefono: '3001234567', servicio_nombre: 'Control de ortodoncia' });
  const cita = todasLasReservas().find((c) => c.fecha === dia);
  assert.equal(cita.nombre, 'Ana Pérez');
  assert.ok(cita.id && cita.creada_en);
  const horas = () => generarDisponibilidad({ semana: '2026-11-23', servicio: 'limpieza' }, { ahoraMs }).dias[1].slots;
  assert.ok(!horas().includes('09:00') && !horas().includes('09:30'), '45 min ocupan 9:00 y 9:30');
  cancelarReserva(cita.id);
  assert.ok(horas().includes('09:00') && horas().includes('09:30'), 'al cancelar vuelven a ofrecerse');
});
prueba('semana completa "No atiende"', () => {
  const todas = diasDeSemana(patron, '2026-11-04', '2026-10-29', '2026-12-19');
  const mk = alternarSemana(MARCAS_VACIAS, todas);
  guardarAgenda(componerAgenda(patron, mk, '2026-10-26', '2026-11-30'), componerMarcas(patron, mk, '2026-10-26', '2026-11-30'));
  const r = generarDisponibilidad({ semana: '2026-11-02', servicio: 'limpieza' }, { ahoraMs });
  assert.ok(r.dias.every((d) => d.motivo === 'no_atiende' && d.slots.length === 0));
  restablecerAgenda();
});

console.log(`\n${n} pruebas OK`);
