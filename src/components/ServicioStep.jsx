import { SERVICIOS } from '../config.js';

export default function ServicioStep({ servicioId, onElegir, onSiguiente }) {
  return (
    <div className="paso">
      <h2 className="paso-titulo">¿Qué necesitas?</h2>
      <p className="paso-sub">Elige el servicio y te mostramos las horas libres de la ortodoncista.</p>
      <fieldset className="servicios">
        <legend className="sr-only">Servicio</legend>
        {SERVICIOS.map((s) => (
          <label key={s.id} className={`servicio${s.id === servicioId ? ' activo' : ''}`}>
            <input type="radio" name="servicio" value={s.id} checked={s.id === servicioId} onChange={() => onElegir(s.id)} />
            <span className="servicio-cuerpo">
              <span className="servicio-nombre">{s.nombre}</span>
              <span className="servicio-desc">{s.descripcion}</span>
            </span>
            <span className="servicio-min">{s.duracion_min} min</span>
          </label>
        ))}
      </fieldset>
      <div className="acciones">
        <span />
        <button type="button" className="btn primario" disabled={!servicioId} onClick={onSiguiente}>Continuar</button>
      </div>
    </div>
  );
}
