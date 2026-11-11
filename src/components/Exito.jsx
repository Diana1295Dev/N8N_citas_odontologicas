import { useEffect, useRef, useState } from 'react';
import { DIRECCION, PROFESIONAL, TELEGRAM_BOT } from '../config.js';
import { fechaLarga, hora12 } from '../lib/fechas.js';
import { descargarICS } from '../lib/ics.js';

const CONFETI = Array.from({ length: 14 }, (_, i) => i);
const ESPERA_TELEGRAM_S = 4; // segundos antes de abrir Telegram solo

export default function Exito({ cita, onNueva }) {
  const titulo = useRef(null);
  useEffect(() => { titulo.current?.focus(); }, []);

  // Si la paciente ya tenía Telegram conectado, el servidor le envió la confirmación; si no, se abre Telegram solo.
  const enlaceTelegram = TELEGRAM_BOT && cita.id ? `https://t.me/${TELEGRAM_BOT}?start=${cita.id}` : '';
  const abrirSolo = Boolean(enlaceTelegram) && !cita.telegram;
  const [faltan, setFaltan] = useState(abrirSolo ? ESPERA_TELEGRAM_S : null);
  useEffect(() => {
    if (faltan === null) return undefined;
    if (faltan === 0) {
      window.location.href = enlaceTelegram;
      return undefined;
    }
    const t = setTimeout(() => setFaltan((n) => (n === null ? null : n - 1)), 1000);
    return () => clearTimeout(t);
  }, [faltan, enlaceTelegram]);

  const agregar = () =>
    descargarICS({
      titulo: `Cita odontológica · ${cita.servicio.nombre}`,
      descripcion: `${cita.servicio.nombre} con ${PROFESIONAL}.`,
      ubicacion: DIRECCION,
      fecha: cita.fecha,
      hora: cita.hora,
      duracion_min: cita.servicio.duracion_min,
    });

  return (
    <div className="exito">
      <div className="exito-marca" aria-hidden="true">
        {CONFETI.map((i) => <span key={i} className="confeti" style={{ '--i': i }} />)}
        <svg viewBox="0 0 64 64" width="72" height="72">
          <circle className="exito-circulo" cx="32" cy="32" r="29" fill="none" strokeWidth="4" />
          <path className="exito-check" d="M20 33l8 8 17-18" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 tabIndex={-1} ref={titulo} className="paso-titulo">¡Tu cita quedó solicitada!</h2>
      <p className="paso-sub">
        {fechaLarga(cita.fecha)} a las {hora12(cita.hora)} · {cita.servicio.nombre}<br />
        Te escribiremos a {cita.email} para confirmarla.
      </p>
      {enlaceTelegram && cita.telegram && (
        <p className="telegram-caja" role="status">
          <span className="telegram-ico" aria-hidden="true">✓</span>
          <span>
            <strong>Te enviamos la confirmación a tu Telegram</strong>
            Revisa el chat del bot: desde ahí puedes confirmar, cambiar la fecha una vez o cancelar.
          </span>
        </p>
      )}
      {abrirSolo && (
        <a className="telegram-caja" href={enlaceTelegram} onClick={() => setFaltan(null)}>
          <span className="telegram-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M21.5 4.5L2.9 11.7c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.5c.3.8 1.3 1 1.9.4l2.6-2.5 4.7 3.5c.7.5 1.7.1 1.9-.7L23 5.9c.2-1-.6-1.8-1.5-1.4zM9.6 14.4l8.6-7.3-6.9 8.4-.3 3.1-1.4-4.2z" fill="currentColor" /></svg>
          </span>
          <span>
            <strong>{faltan ? `Abriendo Telegram en ${faltan}…` : 'Recibe tu confirmación por Telegram'}</strong>
            Toca <b>INICIAR</b> en Telegram y te llega la confirmación al instante, con un recordatorio 3 días antes.
          </span>
        </a>
      )}
      {abrirSolo && faltan !== null && faltan > 0 && (
        <button type="button" className="enlace" onClick={() => setFaltan(null)}>No, gracias</button>
      )}
      <div className="acciones centrado">
        <button type="button" className="btn primario" onClick={agregar}>Agregar al calendario (.ics)</button>
        <button type="button" className="btn fantasma" onClick={onNueva}>Agendar otra cita</button>
      </div>
    </div>
  );
}
