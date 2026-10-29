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
