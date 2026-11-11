import { useEffect, useRef } from 'react';
import { DIRECCION, PROFESIONAL, TELEGRAM_BOT } from '../config.js';
import { fechaLarga, hora12 } from '../lib/fechas.js';
import { descargarICS } from '../lib/ics.js';

const CONFETI = Array.from({ length: 14 }, (_, i) => i);

export default function Exito({ cita, onNueva }) {
  const titulo = useRef(null);
  useEffect(() => { titulo.current?.focus(); }, []);

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
      {TELEGRAM_BOT && cita.id && (
        <a className="telegram-caja" href={`https://t.me/${TELEGRAM_BOT}?start=${cita.id}`} target="_blank" rel="noreferrer">
          <span className="telegram-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M21.5 4.5L2.9 11.7c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.5c.3.8 1.3 1 1.9.4l2.6-2.5 4.7 3.5c.7.5 1.7.1 1.9-.7L23 5.9c.2-1-.6-1.8-1.5-1.4zM9.6 14.4l8.6-7.3-6.9 8.4-.3 3.1-1.4-4.2z" fill="currentColor" /></svg>
          </span>
          <span>
            <strong>Confirma tu cita por Telegram</strong>
            Te enviamos la confirmación y un recordatorio 7 días antes. Desde ahí puedes confirmar, cambiar la fecha una vez o cancelar.
          </span>
        </a>
      )}
      <div className="acciones centrado">
        <button type="button" className="btn primario" onClick={agregar}>Agregar al calendario (.ics)</button>
        <button type="button" className="btn fantasma" onClick={onNueva}>Agendar otra cita</button>
      </div>
    </div>
  );
}
