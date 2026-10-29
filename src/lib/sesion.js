// Ingreso básico de la asistente (solo frontend).
// Se guarda la huella SHA-256 de "identificacion:contraseña", nunca la contraseña.
// Ojo: en el navegador esto solo evita que una paciente entre por accidente; la protección
// real llega cuando la API valide la sesión en el servidor.

const env = import.meta.env || {};
export const USUARIO = env.VITE_ASISTENTE_USUARIO || '1234567890'; // credenciales de demo: 1234567890 / demo1234
export const HUELLA = env.VITE_ASISTENTE_CLAVE_SHA256 || '9124c31449d66475957f0bf6efba6e29d45d43038c7027d14ab4a59c6a4bde0d';
// Mientras no haya credenciales reales en el .env, el formulario llega precargado con las de prueba
export const DEMO = env.VITE_ASISTENTE_CLAVE_SHA256 ? null : { usuario: '1234567890', clave: 'demo1234' };

const CLAVE_SESION = 'citas.sesion.v1';
const CLAVE_INTENTOS = 'citas.intentos.v1';
export const DURACION_MS = 8 * 3600000; // la sesión dura una jornada
export const MAX_INTENTOS = 5;
export const BLOQUEO_MS = 60000;

const leer = (almacen, clave) => {
  try {
    return JSON.parse(almacen.getItem(clave)) || null;
  } catch {
    return null;
  }
};
const escribir = (almacen, clave, valor) => {
  try {
    if (valor == null) almacen.removeItem(clave);
    else almacen.setItem(clave, JSON.stringify(valor));
  } catch { /* almacenamiento no disponible */ }
};
const sesionStore = () => globalThis.sessionStorage;
const localStore = () => globalThis.localStorage;

export async function huellaDe(usuario, clave) {
  const datos = new TextEncoder().encode(`${usuario}:${clave}`);
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', datos));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Milisegundos que faltan de bloqueo tras varios intentos fallidos (0 si no hay). */
export function bloqueoRestante(ahora = Date.now()) {
  const i = leer(localStore(), CLAVE_INTENTOS);
  return i?.hasta ? Math.max(0, i.hasta - ahora) : 0;
}

/** Devuelve { ok } o { ok: false, error }. */
export async function ingresar(usuario, clave, ahora = Date.now()) {
  if (bloqueoRestante(ahora)) return { ok: false, error: 'bloqueado' };
  const id = String(usuario).replace(/\D/g, '');
  const ok = id === USUARIO && (await huellaDe(id, clave)) === HUELLA;
  if (ok) {
    escribir(localStore(), CLAVE_INTENTOS, null);
    escribir(sesionStore(), CLAVE_SESION, { usuario: id, vence: ahora + DURACION_MS });
    return { ok: true };
  }
  const previos = leer(localStore(), CLAVE_INTENTOS)?.fallos || 0;
  const fallos = previos + 1;
  if (fallos >= MAX_INTENTOS) {
    escribir(localStore(), CLAVE_INTENTOS, { fallos: 0, hasta: ahora + BLOQUEO_MS });
    return { ok: false, error: 'bloqueado' };
  }
  escribir(localStore(), CLAVE_INTENTOS, { fallos });
  return { ok: false, error: 'credenciales', quedan: MAX_INTENTOS - fallos };
}

export function haySesion(ahora = Date.now()) {
  const s = leer(sesionStore(), CLAVE_SESION);
  return Boolean(s && s.vence > ahora);
}

export const cerrarSesion = () => escribir(sesionStore(), CLAVE_SESION, null);
