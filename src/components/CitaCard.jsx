import { PROFESIONAL } from '../config.js';
import { hora12, partesFecha, capitalizar } from '../lib/fechas.js';

export default function CitaCard({ servicio, fecha, hora }) {
  const p = fecha ? partesFecha(fecha) : null;
  return (
    <aside className="cita-card" aria-label="Resumen de tu cita" aria-live="polite">
      <p className="cita-etq">Tu cita</p>
      <div className="cita-fecha">
        <span className={`cita-num${p ? '' : ' vacio'}`} key={fecha || 'vacio'}>{p ? p.dia : '–'}</span>
        <span className="cita-mes">
          {p ? <><strong>{capitalizar(p.nombreDia)}</strong><br />{p.mes} de {p.anio}</> : <>Elige un día<br />en el calendario</>}
        </span>
      </div>
      <dl className="cita-datos">
        <div><dt>Hora</dt><dd key={hora || 'sin'} className="pop-in">{hora ? hora12(hora) : 'Por elegir'}</dd></div>
        <div><dt>Servicio</dt><dd>{servicio ? servicio.nombre : 'Por elegir'}</dd></div>
        <div><dt>Duración</dt><dd>{servicio ? `${servicio.duracion_min} min` : '—'}</dd></div>
        <div><dt>Profesional</dt><dd>{PROFESIONAL}</dd></div>
      </dl>
    </aside>
  );
}
