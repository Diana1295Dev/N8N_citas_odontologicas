// La agenda que guarda la asistente en el calendario es exactamente lo que ve la paciente.
import assert from 'node:assert/strict';
import { generarDisponibilidad, marcarTomada } from '../src/data/disponibilidad.mock.js';
import { copiaAgenda, errorBloques, guardarAgenda, restablecerAgenda } from '../src/data/horario.store.js';

let n = 0;
const prueba = (nombre, fn) => {
  fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};
const ahoraMs = Date.UTC(2026, 9, 26, 12, 0); // lunes 26-oct-2026, 07:00 Bogotá
const pedir = (semana, servicio = 'limpieza') => generarDisponibilidad({ semana, servicio }, { ahoraMs });

console.log('Agenda de la asistente (por fecha)');
prueba('lo que marca en el calendario es exactamente lo que se ofrece', () => {
  guardarAgenda({ '2026-11-02': [[540, 660]], '2026-11-06': [[600, 720]] }); // lun 2 de 9 a 11, vie 6 de 10 a 12
  const r = pedir('2026-11-02');
  assert.deepEqual(r.dias[0].slots, ['09:00', '09:30', '10:00', '10:30']);
  assert.deepEqual(r.dias[4].slots, ['10:00', '10:30', '11:00', '11:30']);
  assert.ok([1, 2, 3, 5].every((i) => r.dias[i].slots.length === 0));
  assert.equal(r.dias.length, 6);
});
prueba('las fechas que no marcó no tienen cupo (otros lunes, otras semanas)', () => {
  assert.ok(pedir('2026-11-09').dias.every((d) => d.slots.length === 0));
  assert.ok(pedir('2026-11-16').dias.every((d) => d.slots.length === 0));
});
prueba('dos bloques en un día, con almuerzo en medio', () => {
  guardarAgenda({ '2026-11-03': [[480, 720], [840, 1020]] });
  const r = pedir('2026-11-02');
  assert.equal(r.dias[1].slots.length, 14);
  assert.ok(!r.dias[1].slots.includes('12:00') && !r.dias[1].slots.includes('13:30'));
  const o = pedir('2026-11-02', 'ortodoncia');
  assert.ok(!o.dias[1].slots.includes('11:30') && !o.dias[1].slots.includes('16:30'), '45 min no cruza el almuerzo');
});
prueba('ortodoncia (45 min) necesita 2 bloques dentro de lo habilitado', () => {
  guardarAgenda({ '2026-11-02': [[540, 660]] });
  assert.deepEqual(pedir('2026-11-02', 'ortodoncia').dias[0].slots, ['09:00', '09:30', '10:00']);
});
prueba('quitar la atención de un día lo deja sin cupo', () => {
  guardarAgenda({ '2026-11-04': [[540, 600]] });
  assert.deepEqual(pedir('2026-11-02').dias[0].slots, []);
  assert.deepEqual(pedir('2026-11-02').dias[2].slots, ['09:00', '09:30']);
});
prueba('restablecer vuelve a la agenda de ejemplo', () => {
  restablecerAgenda();
  const ej = copiaAgenda('2026-11-02', '2026-11-08');
  assert.deepEqual(Object.keys(ej), ['2026-11-03', '2026-11-05', '2026-11-07']); // mar, jue, sáb
  assert.ok(pedir('2026-11-16').dias.every((x) => x.slots.length === 0), '4.ª semana vacía de ejemplo');
});
prueba('validación de bloques cruzados', () => {
  assert.equal(errorBloques([[480, 720], [840, 1020]]), '');
  assert.match(errorBloques([[480, 720], [700, 1020]]), /cruzarse/);
  assert.match(errorBloques([[720, 720]]), /posterior/);
});
console.log('Motivo de un día sin horas');
prueba('no atiende / sin cupo / ya pasó se distinguen', () => {
  guardarAgenda({ '2026-10-27': [[540, 600]], '2026-10-29': [[840, 1020]], '2026-10-31': [[540, 600]] });
  marcarTomada('2026-10-31', '09:00', 60); // el sábado atiende pero todo quedó tomado
  const ahora = Date.UTC(2026, 9, 29, 21, 40); // jueves 29-oct, 16:40 Bogotá
  const r = generarDisponibilidad({ semana: '2026-10-26', servicio: 'limpieza' }, { ahoraMs: ahora });
  const motivo = (i) => r.dias[i].motivo;
  assert.equal(motivo(0), 'pasado', 'lunes ya pasó');
  assert.equal(motivo(1), 'pasado', 'martes ya pasó aunque tuviera bloque');
  assert.equal(motivo(2), 'pasado', 'miércoles anterior a hoy');
  assert.equal(motivo(3), 'pasado', 'hoy 16:40: lo que queda empieza demasiado pronto');
  assert.equal(motivo(4), 'no_atiende', 'viernes sin bloques');
  assert.equal(motivo(5), 'sin_cupo', 'sábado atiende pero está tomado');
  assert.ok(r.dias.every((d) => (d.slots.length > 0) === !d.motivo), 'motivo solo cuando no hay horas');
});
prueba('una semana fuera de agenda es "no atiende"', () => {
  const r = generarDisponibilidad({ semana: '2026-11-09', servicio: 'limpieza' }, { ahoraMs });
  assert.ok(r.dias.every((d) => d.motivo === 'no_atiende'));
});
console.log(`\n${n} pruebas OK`);
