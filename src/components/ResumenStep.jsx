import { PROFESIONAL } from '../config.js';
import { fechaLarga, hora12 } from '../lib/fechas.js';

export default function ResumenStep({ servicio, fecha, hora, datos, enviando, errorEnvio, onAtras, onConfirmar }) {
  const filas = [
    ['Servicio', `${servicio.nombre} (${servicio.duracion_min} min)`],
    ['Fecha', fechaLarga(fecha)],
    ['Hora', hora12(hora)],
    ['Profesional', PROFESIONAL],
    ['Paciente', datos.nombre],
    ['Celular', datos.telefono],
    ['Correo', datos.email],
  ];
  return (
    <div className="paso">
      <h2 className="paso-titulo">Revisa y confirma</h2>
      <p className="paso-sub">Si todo está bien, confirma tu cita.</p>
      <dl className="resumen">
        {filas.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      <section className="como-llega" aria-labelledby="t-como-llega">
        <h3 id="t-como-llega">¿Cómo te va a llegar la confirmación?</h3>
        <p className="como-llega-intro">Apenas toques <b>Confirmar cita</b>, te avisamos por dos lados:</p>
        <ol>
          <li>
            <span className="como-llega-ico" aria-hidden="true">📧</span>
            <span><b>A tu correo.</b> Te escribimos a <b>{datos.email}</b> con todos los datos de tu cita.</span>
          </li>
          <li>
            <span className="como-llega-ico" aria-hidden="true">📲</span>
            <span><b>A tu Telegram.</b> Se abre solito; solo toca <b>INICIAR</b> y listo. Por ahí también te recordamos tu cita 3 días antes.</span>
          </li>
          <li>
            <span className="como-llega-ico" aria-hidden="true">🔎</span>
            <span><b>¿No ves el correo?</b> Dale un par de minutos y revisa tu carpeta de <b>Spam</b> o <b>Promociones</b>. Si está ahí, márcalo como «No es spam» y los próximos te llegarán directo.</span>
          </li>
        </ol>
      </section>
      {errorEnvio && <p className="alerta" role="alert">{errorEnvio}</p>}
      <div className="acciones">
        <button type="button" className="btn fantasma" onClick={onAtras} disabled={enviando}>Atrás</button>
        <button type="button" className="btn primario" onClick={onConfirmar} disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Enviando…' : 'Confirmar cita'}
        </button>
      </div>
    </div>
  );
}
