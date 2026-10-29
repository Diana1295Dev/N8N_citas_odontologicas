import { useEffect, useRef, useState } from 'react';
import { todasLasReservas } from '../data/reservas.store.js';
import { ahoraBogota, horaAMin } from '../lib/fechas.js';
import { bloqueoRestante, cerrarSesion, DEMO, haySesion, ingresar, USUARIO } from '../lib/sesion.js';
import Asistente from './Asistente.jsx';
import TableroCitas from './TableroCitas.jsx';

const Candado = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
  </svg>
);
const Ojo = ({ tachado }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" />
    {tachado && <path d="M4 4l16 16" />}
  </svg>
);

function Ingreso({ onEntrar }) {
  const [usuario, setUsuario] = useState(DEMO?.usuario || '');
  const [clave, setClave] = useState(DEMO?.clave || '');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(() => bloqueoRestante());
  const campoUsuario = useRef(null);

  // Cuenta regresiva del bloqueo por intentos fallidos
  useEffect(() => {
    if (!espera) return undefined;
    const t = setInterval(() => {
      const r = bloqueoRestante();
      setEspera(r);
      if (!r) setError('');
    }, 1000);
    return () => clearInterval(t);
  }, [espera > 0]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!usuario.trim() || !clave) {
      setError('Escribe tu número de identificación y tu contraseña.');
      return;
    }
    setEnviando(true);
    const r = await ingresar(usuario, clave);
    setEnviando(false);
    if (r.ok) return onEntrar();
    setClave('');
    if (r.error === 'bloqueado') {
      setEspera(bloqueoRestante());
      setError('Demasiados intentos. Espera un minuto y vuelve a intentarlo.');
    } else {
      setError(`Identificación o contraseña incorrecta. Te quedan ${r.quedan} intento${r.quedan === 1 ? '' : 's'}.`);
      campoUsuario.current?.focus();
    }
  };

  const segundos = Math.ceil(espera / 1000);
  return (
    <main className="contenedor">
      <section className="panel ingreso">
        <span className="ingreso-ico"><Candado /></span>
        <h1 className="paso-titulo">Ingreso de la asistente</h1>
        <p className="paso-sub">Esta zona es solo para el equipo del consultorio.</p>
        {DEMO && (
          <p className="demo" role="note"><span aria-hidden="true">●</span> Modo prueba: los datos ya están cargados, solo toca «Entrar»</p>
        )}

        <form onSubmit={enviar} noValidate>
          <div className="campo">
            <label htmlFor="usuario">Número de identificación</label>
            <input
              ref={campoUsuario} id="usuario" name="usuario" type="text" inputMode="numeric" autoComplete="username"
              value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus
              aria-invalid={error ? 'true' : undefined} aria-describedby={error ? 'ingreso-error' : undefined}
            />
          </div>
          <div className="campo">
            <label htmlFor="clave">Contraseña</label>
            <div className="clave-caja">
              <input
                id="clave" name="clave" type={ver ? 'text' : 'password'} autoComplete="current-password"
                value={clave} onChange={(e) => setClave(e.target.value)}
                aria-invalid={error ? 'true' : undefined} aria-describedby={error ? 'ingreso-error' : undefined}
              />
              <button type="button" className="clave-ver" onClick={() => setVer((v) => !v)} aria-pressed={ver} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                <Ojo tachado={ver} />
              </button>
            </div>
          </div>
          <p className="campo-error ingreso-error" id="ingreso-error" role="alert">
            {error}{espera > 0 && ` (${segundos} s)`}
          </p>
          <button className="btn primario ingreso-btn" type="submit" disabled={enviando || espera > 0}>
            {enviando ? 'Verificando…' : 'Entrar'}
          </button>
        </form>
        <p className="ingreso-pie">¿Eres paciente? <a href="#/paciente">Agenda tu cita aquí</a></p>
      </section>
    </main>
  );
}

const IcoBarra = ({ d }) => (
  <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const PESTANAS = [
  ['citas', 'Citas confirmadas', 'Citas', 'M7 3v4M17 3v4M3.5 10h17M5.5 5h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9 15l2 2 4-4'],
  ['agenda', 'Disponibilidad', 'Agenda', 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 7.5V12l3 2'],
];
const ICO_SALIR = 'M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10';

// Citas que aún no terminan (para el contador de la pestaña)
function contarProximas() {
  const ahora = ahoraBogota();
  return todasLasReservas().filter((c) => c.fecha > ahora.fecha || (c.fecha === ahora.fecha && horaAMin(c.hora) + c.duracion_min > ahora.minutos)).length;
}

export default function AccesoAsistente() {
  const [dentro, setDentro] = useState(() => haySesion());
  const [pestana, setPestana] = useState('citas');
  const [, setVersion] = useState(0); // fuerza a recalcular el contador cuando el tablero cambia
  if (!dentro) return <Ingreso onEntrar={() => setDentro(true)} />;
  const salir = () => {
    cerrarSesion();
    setDentro(false);
  };
  const proximas = contarProximas();
  return (
    <main className="contenedor">
      <div className="panel-barra">
        <div className="pestanas" role="tablist" aria-label="Panel de la asistente">
          {PESTANAS.map(([id, texto, corto, icono]) => (
            <button
              key={id} id={`tab-${id}`} type="button" role="tab" aria-selected={pestana === id} aria-controls="panel-asistente"
              className={`pestana${pestana === id ? ' activa' : ''}`} onClick={() => setPestana(id)}
            >
              <IcoBarra d={icono} />
              <span className="pestana-largo">{texto}</span>
              <span className="pestana-corto" aria-hidden="true">{corto}</span>
              {id === 'citas' && proximas > 0 && (
                <span className="pestana-n"><span aria-hidden="true">{proximas}</span><span className="sr-only">, {proximas} próximas</span></span>
              )}
            </button>
          ))}
        </div>
        <div className="barra-usuario">
          <span className="usuario-ini" aria-hidden="true">AS</span>
          <span className="usuario-txt">
            <strong>Asistente</strong>
            <span>CC ···{USUARIO.slice(-4)}</span>
          </span>
          <button type="button" className="btn-salir" onClick={salir}>
            <IcoBarra d={ICO_SALIR} /><span>Salir</span>
          </button>
        </div>
      </div>
      <div id="panel-asistente" role="tabpanel" aria-labelledby={`tab-${pestana}`}>
        {pestana === 'citas' ? <TableroCitas onCambio={() => setVersion((v) => v + 1)} /> : <Asistente />}
      </div>
    </main>
  );
}
