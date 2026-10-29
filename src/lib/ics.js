import { OFFSET_BOGOTA_H } from '../config.js';
import { horaAMin } from './fechas.js';

const pad = (n) => String(n).padStart(2, '0');

/** Fecha/hora local de Bogotá -> "AAAAMMDDTHHMMSSZ" (UTC). */
export function aUTC(fecha, hhmm, sumarMin = 0) {
  const [y, m, d] = fecha.split('-').map(Number);
  const min = horaAMin(hhmm) + sumarMin;
  const dt = new Date(Date.UTC(y, m - 1, d, OFFSET_BOGOTA_H, min));
  return (
    `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}` +
    `T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`
  );
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

export function crearICS({ titulo, descripcion, ubicacion, fecha, hora, duracion_min }) {
  const ahora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Patricia Rojas//Citas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${fecha}-${hora.replace(':', '')}@sonrisaclara`,
    `DTSTAMP:${ahora}`,
    `DTSTART:${aUTC(fecha, hora)}`,
    `DTEND:${aUTC(fecha, hora, duracion_min)}`,
    `SUMMARY:${esc(titulo)}`,
    `DESCRIPTION:${esc(descripcion)}`,
    `LOCATION:${esc(ubicacion)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(titulo)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function descargarICS(datos, nombre = 'cita-odontologica.ics') {
  const blob = new Blob([crearICS(datos)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
