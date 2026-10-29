// Genera las líneas del .env para cambiar el usuario y la contraseña de la asistente.
// Uso: node scripts/clave-asistente.mjs <identificacion> <contraseña>
import { createHash } from 'node:crypto';

const [usuario, clave] = process.argv.slice(2);
if (!usuario || !clave) {
  console.error('Uso: node scripts/clave-asistente.mjs <identificacion> <contraseña>');
  process.exit(1);
}
const id = usuario.replace(/\D/g, '');
const huella = createHash('sha256').update(`${id}:${clave}`).digest('hex');
console.log(`VITE_ASISTENTE_USUARIO=${id}\nVITE_ASISTENTE_CLAVE_SHA256=${huella}`);
