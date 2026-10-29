// Ingreso de la asistente: credenciales, bloqueo por intentos y vencimiento de la sesión.
import assert from 'node:assert/strict';

const memoria = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};
globalThis.sessionStorage = memoria();
globalThis.localStorage = memoria();
const { BLOQUEO_MS, DURACION_MS, MAX_INTENTOS, cerrarSesion, haySesion, ingresar } = await import('../src/lib/sesion.js');

let n = 0;
const prueba = async (nombre, fn) => {
  await fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};
const t0 = Date.UTC(2026, 9, 29, 15, 0);

console.log('Ingreso de la asistente');
await prueba('sin sesión al inicio; credenciales correctas abren sesión', async () => {
  assert.equal(haySesion(t0), false);
  assert.deepEqual(await ingresar('1234567890', 'demo1234', t0), { ok: true });
  assert.equal(haySesion(t0), true);
});
await prueba('acepta la identificación con puntos o espacios', async () => {
  cerrarSesion();
  assert.equal((await ingresar('1.234.567.890', 'demo1234', t0)).ok, true);
});
await prueba('la sesión vence tras la jornada y se puede cerrar', async () => {
  assert.equal(haySesion(t0 + DURACION_MS + 1), false);
  cerrarSesion();
  assert.equal(haySesion(t0), false);
});
await prueba('contraseña o usuario incorrectos no entran y cuentan intentos', async () => {
  const r = await ingresar('1234567890', 'demo1235', t0);
  assert.deepEqual(r, { ok: false, error: 'credenciales', quedan: MAX_INTENTOS - 1 });
  assert.equal((await ingresar('999', 'demo1234', t0)).quedan, MAX_INTENTOS - 2);
  assert.equal(haySesion(t0), false);
});
await prueba('tras 5 fallos se bloquea un minuto, incluso con la clave correcta', async () => {
  for (let i = 0; i < 3; i++) await ingresar('1234567890', 'x', t0);
  assert.equal((await ingresar('1234567890', 'demo1234', t0 + 1000)).error, 'bloqueado');
  assert.equal((await ingresar('1234567890', 'demo1234', t0 + BLOQUEO_MS + 1)).ok, true);
});
console.log(`\n${n} pruebas OK`);
