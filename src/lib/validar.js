const soloDigitos = (s) => s.replace(/\D/g, '');

export function validarDatos({ nombre, telefono, email, consentimiento }) {
  const e = {};
  if (nombre.trim().length < 3) e.nombre = 'Escribe tu nombre completo.';
  const tel = soloDigitos(telefono);
  const local = tel.startsWith('57') && tel.length === 12 ? tel.slice(2) : tel;
  if (!/^3\d{9}$/.test(local)) e.telefono = 'Escribe un celular de 10 dígitos que empiece por 3.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (!consentimiento) e.consentimiento = 'Necesitamos tu autorización para contactarte.';
  return e;
}

export const normalizarTelefono = (t) => {
  const d = soloDigitos(t);
  return d.startsWith('57') && d.length === 12 ? d.slice(2) : d;
};
