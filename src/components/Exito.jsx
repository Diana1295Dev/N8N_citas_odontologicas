import { useEffect, useRef } from 'react';
import { DIRECCION, PROFESIONAL } from '../config.js';
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
      <div className="acciones centrado">
        <button type="button" className="btn primario" onClick={agregar}>Agregar al calendario (.ics)</button>
        <button type="button" className="btn fantasma" onClick={onNueva}>Agendar otra cita</button>
      </div>
    </div>
  );
}
