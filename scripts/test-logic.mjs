// Pruebas de la lógica de slots y semanas. Ejecutar con: npm test
import assert from 'node:assert/strict';
import { generarDisponibilidad } from '../src/data/disponibilidad.mock.js';
import {
  addDays, ahoraBogota, formatRango, hora12, horaAMin, lunesDe, rangoSemanas, semanaActual,
} from '../src/lib/fechas.js';
import { aUTC } from '../src/lib/ics.js';
import { filtrarAnticipacion, slotsConsecutivos } from '../src/lib/slots.js';
import { normalizarTelefono, validarDatos } from '../src/lib/validar.js';

let n = 0;
const prueba = (nombre, fn) => {
  fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};
// Hora de Bogotá -> milisegundos UTC
const bog = (f, hhmm) => {
  const [y, m, d] = f.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  return Date.UTC(y, m - 1, d, h + 5, mi);
};

console.log('Slots consecutivos');
prueba('45 min necesita 2 bloques seguidos', () => {
  assert.deepEqual(slotsConsecutivos([480, 510, 540], 45), [480, 510]);
  assert.deepEqual(slotsConsecutivos([480, 540], 45), []);
  assert.deepEqual(slotsConsecutivos([480, 540], 30), [480, 540]);
});
prueba('el hueco del almuerzo corta la cadena', () => {
  assert.deepEqual(slotsConsecutivos([660, 690, 840, 870], 45), [660, 840]);
});
prueba('60 min necesita 2 bloques; 90 min, 3', () => {
  assert.deepEqual(slotsConsecutivos([480, 510, 540, 570], 60), [480, 510, 540]);
  assert.deepEqual(slotsConsecutivos([480, 510, 540, 570], 90), [480, 510]);
});

console.log('Mock: ortodoncia respeta bloques libres');
prueba('cada slot de ortodoncia tiene el bloque siguiente libre y no cruza el almuerzo', () => {
  const ahoraMs = bog('2026-10-26', '07:00');
  let total = 0;
  for (let w = 0; w < 8; w++) {
    const semana = addDays('2026-10-26', 7 * w);
    const orto = generarDisponibilidad({ semana, servicio: 'ortodoncia' }, { ahoraMs });
    const base = generarDisponibilidad({ semana, servicio: 'limpieza' }, { ahoraMs });
    orto.dias.forEach((d, i) => {
      for (const s of d.slots) {
        total++;
        const sig = (horaAMin(s) + 30);
        const h = `${String(Math.floor(sig / 60)).padStart(2, '0')}:${String(sig % 60).padStart(2, '0')}`;
        assert.ok(base.dias[i].slots.includes(s), `${d.fecha} ${s} debe estar libre`);
        assert.ok(base.dias[i].slots.includes(h), `${d.fecha} ${h} (2.º bloque) debe estar libre`);
        assert.ok(!['11:30', '16:30'].includes(s), 'no cabe antes del almuerzo/cierre');
      }
    });
    assert.equal(orto.duracion_min, 45);
  }
  assert.ok(total > 20, 'debe haber cupos de ortodoncia');
});

console.log('Forma de la respuesta y semanas');
prueba('siempre 6 días lunes a sábado y horario del mock', () => {
  const ahoraMs = bog('2026-10-26', '07:00');
  const r = generarDisponibilidad({ semana: '2026-10-28', servicio: 'limpieza' }, { ahoraMs }); // miércoles -> normaliza
  assert.equal(r.semana_inicio, '2026-10-26');
  assert.equal(r.semana_fin, '2026-10-31');
  assert.equal(r.dias.length, 6);
  r.dias.forEach((d, i) => {
    assert.equal(d.fecha, addDays('2026-10-26', i));
    if ([0, 2, 4].includes(i)) assert.deepEqual(d.slots, [], 'lun, mié y vie sin atención');
  });
  assert.ok(r.dias[1].slots.every((s) => horaAMin(s) >= 480 && horaAMin(s) < 1020));
  assert.ok(r.dias[5].slots.every((s) => horaAMin(s) >= 480 && horaAMin(s) < 660));
});
prueba('es determinístico por fecha', () => {
  const ahoraMs = bog('2026-10-26', '07:00');
  const a = generarDisponibilidad({ semana: '2026-11-09', servicio: 'valoracion' }, { ahoraMs });
  const b = generarDisponibilidad({ semana: '2026-11-09', servicio: 'valoracion' }, { ahoraMs });
  assert.deepEqual(a, b);
});
prueba('la 4.ª semana queda completamente vacía y las demás tienen cupo', () => {
  const ahoraMs = bog('2026-10-26', '07:00');
  for (let w = 0; w < 8; w++) {
    const r = generarDisponibilidad({ semana: addDays('2026-10-26', 7 * w), servicio: 'valoracion' }, { ahoraMs });
    const total = r.dias.reduce((s, d) => s + d.slots.length, 0);
    if (w === 3) assert.equal(total, 0);
    else assert.ok(total > 0, `semana ${w} con cupo`);
    assert.equal(r.dias.length, 6);
  }
});
prueba('fuera de las 8 semanas, o en el pasado, no hay cupos', () => {
  const ahoraMs = bog('2026-10-26', '07:00');
  for (const semana of ['2026-12-21', '2026-10-19']) {
    const r = generarDisponibilidad({ semana, servicio: 'valoracion' }, { ahoraMs });
    assert.ok(r.dias.every((d) => d.slots.length === 0), semana);
    assert.equal(r.dias.length, 6);
  }
});
prueba('cambio de mes y de año en los rangos', () => {
  assert.equal(formatRango('2026-10-26'), '26 al 31 de octubre');
  assert.equal(formatRango('2026-09-28'), '28 de septiembre al 3 de octubre');
  assert.equal(formatRango('2026-11-30'), '30 de noviembre al 5 de diciembre');
  assert.equal(formatRango('2026-12-28'), '28 de diciembre de 2026 al 2 de enero de 2027');
  assert.equal(lunesDe('2026-11-01'), '2026-10-26'); // domingo
  assert.equal(lunesDe('2026-11-02'), '2026-11-02');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
});
prueba('rango de navegación: 8 semanas y domingo salta a la siguiente', () => {
  const r = rangoSemanas(ahoraBogota(bog('2026-10-29', '10:00')));
  assert.equal(r.min, '2026-10-26');
  assert.equal(r.max, '2026-12-14');
  assert.equal(semanaActual('2026-11-01'), '2026-11-02');
});

console.log('Hoy a las 16:40 y anticipación');
prueba('jueves 16:40: ya no queda nada ese día, sí el sábado', () => {
  const ahoraMs = bog('2026-10-29', '16:40');
  const r = generarDisponibilidad({ semana: '2026-10-26', servicio: 'limpieza' }, { ahoraMs });
  assert.deepEqual(r.dias[1].slots, [], 'martes pasado');
  assert.deepEqual(r.dias[3].slots, [], 'jueves: 16:30 empieza antes de 17:40');
  assert.ok(r.dias[5].slots.length > 0, 'sábado intacto');
});
prueba('exactamente 1 hora de anticipación sí cuenta; 59 min no', () => {
  const ahora = ahoraBogota(bog('2026-10-29', '10:00'));
  assert.deepEqual(filtrarAnticipacion('2026-10-29', [599, 600, 660], ahora), [660]);
  assert.deepEqual(filtrarAnticipacion('2026-10-29', [600, 660], ahora), [660]);
  assert.deepEqual(filtrarAnticipacion('2026-10-28', [600], ahora), []);
  assert.deepEqual(filtrarAnticipacion('2026-10-30', [480], ahora), [480]);
});
prueba('zona horaria Bogotá: 02:00 UTC es 21:00 del día anterior', () => {
  const a = ahoraBogota(Date.UTC(2026, 9, 30, 2, 0));
  assert.deepEqual(a, { fecha: '2026-10-29', minutos: 21 * 60 });
});

console.log('Formato, .ics y validaciones');
prueba('hora12', () => {
  assert.equal(hora12('09:30'), '9:30 a. m.');
  assert.equal(hora12('12:00'), '12:00 p. m.');
  assert.equal(hora12('14:30'), '2:30 p. m.');
});
prueba('.ics convierte hora de Bogotá a UTC (+5 h)', () => {
  assert.equal(aUTC('2026-11-03', '14:00'), '20261103T190000Z');
  assert.equal(aUTC('2026-11-03', '20:00', 45), '20261104T014500Z');
});
prueba('validaciones', () => {
  const ok = { nombre: 'Ana Pérez', telefono: '300 123 4567', email: 'ana@correo.com', consentimiento: true };
  assert.deepEqual(validarDatos(ok), {});
  assert.deepEqual(Object.keys(validarDatos({ ...ok, telefono: '12345', email: 'x', nombre: 'A', consentimiento: false })).sort(),
    ['consentimiento', 'email', 'nombre', 'telefono']);
  assert.equal(normalizarTelefono('+57 300 123 4567'), '3001234567');
});

console.log(`\n${n} pruebas OK`);
