import { useState } from 'react';
import { validarDatos } from '../lib/validar.js';

function Campo({ id, etiqueta, error, ayuda, children }) {
  return (
    <div className={`campo${error ? ' con-error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {ayuda && !error && <p className="campo-ayuda" id={`${id}-ayuda`}>{ayuda}</p>}
      {error && <p className="campo-error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}

export default function DatosStep({ datos, trampa, onCambio, onTrampa, onAtras, onSiguiente }) {
  const [tocados, setTocados] = useState({});
  const errores = validarDatos(datos);
  const ver = (k) => (tocados[k] ? errores[k] : undefined);
  const tocar = (k) => setTocados((t) => ({ ...t, [k]: true }));
  const props = (k, ayuda) => ({
    id: k,
    name: k,
    value: datos[k],
    onChange: (e) => onCambio(k, e.target.value),
    onBlur: () => tocar(k),
    'aria-invalid': ver(k) ? 'true' : undefined,
    'aria-describedby': ver(k) ? `${k}-error` : ayuda ? `${k}-ayuda` : undefined,
  });

  const enviar = (e) => {
    e.preventDefault();
    if (Object.keys(errores).length) {
      setTocados({ nombre: true, telefono: true, email: true, consentimiento: true });
      const primero = ['nombre', 'telefono', 'email', 'consentimiento'].find((k) => errores[k]);
      document.getElementById(primero)?.focus();
      return;
    }
    onSiguiente();
  };

  return (
    <form className="paso" onSubmit={enviar} noValidate>
      <h2 className="paso-titulo">Tus datos</h2>
      <p className="paso-sub">Solo los usamos para confirmar tu cita.</p>

      <Campo id="nombre" etiqueta="Nombre completo" error={ver('nombre')}>
        <input {...props('nombre')} type="text" autoComplete="name" />
      </Campo>
      <div className="fila-2">
        <Campo id="telefono" etiqueta="Celular" error={ver('telefono')} ayuda="Ej. 300 123 4567">
          <input {...props('telefono', true)} type="tel" inputMode="tel" autoComplete="tel-national" />
        </Campo>
        <Campo id="email" etiqueta="Correo electrónico" error={ver('email')}>
          <input {...props('email')} type="email" autoComplete="email" />
        </Campo>
      </div>
      <Campo id="notas" etiqueta="¿Algo que debamos saber? (opcional)">
        <textarea {...props('notas')} rows="3" maxLength={400} />
      </Campo>

      {/* Campo trampa anti-bots: invisible para personas, los bots suelen llenarlo. */}
      <div className="trampa" aria-hidden="true">
        <label htmlFor="website">Sitio web</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={trampa} onChange={(e) => onTrampa(e.target.value)} />
      </div>

      <div className={`campo check${ver('consentimiento') ? ' con-error' : ''}`}>
        <label className="check-label">
          <input
            id="consentimiento" type="checkbox" checked={datos.consentimiento}
            onChange={(e) => onCambio('consentimiento', e.target.checked)}
            onBlur={() => tocar('consentimiento')}
            aria-invalid={ver('consentimiento') ? 'true' : undefined}
            aria-describedby={ver('consentimiento') ? 'consentimiento-error' : undefined}
          />
          <span>Autorizo que el consultorio me contacte para confirmar mi cita.</span>
        </label>
        {ver('consentimiento') && <p className="campo-error" id="consentimiento-error">{errores.consentimiento}</p>}
      </div>

      <div className="acciones">
        <button type="button" className="btn fantasma" onClick={onAtras}>Atrás</button>
        <button type="submit" className="btn primario">Revisar cita</button>
      </div>
    </form>
  );
}
