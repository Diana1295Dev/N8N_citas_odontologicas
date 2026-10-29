import { useEffect, useMemo, useRef, useState } from 'react';
import { USA_MOCK } from '../api/disponibilidad.js';
import { addDays, capitalizar, formatRango, hora12, horaAMin, indiceDia, partesFecha } from '../lib/fechas.js';
import { buscarPrimerCupo, hayCupo, useSemana } from '../hooks/semanas.js';

// Por qué un día no tiene horas. Si la API no envía `motivo`, se asume "sin cupo".
const ESTADOS = {
  no_atiende: { texto: 'No atiende', aria: 'la ortodoncista no atiende ese día' },
  sin_cupo: { texto: 'Sin cupo', aria: 'sin cupo, ya no quedan horas libres' },
  pasado: { texto: 'Ya pasó', aria: 'ya pasó' },
};
const motivoDe = (d) => (ESTADOS[d.motivo] ? d.motivo : 'sin_cupo');

/** Mensaje de una semana sin horas, según el motivo de sus días. */
function mensajeSemanaVacia(data, rango) {
  const motivos = new Set(data.dias.map(motivoDe).filter((m) => m !== 'pasado'));
  if (motivos.size === 1 && motivos.has('no_atiende')) {
    return { titulo: 'La ortodoncista no atiende esta semana', texto: `No hay atención programada del ${rango}.` };
  }
  if (motivos.size === 1 && motivos.has('sin_cupo')) {
    return { titulo: 'Esta semana ya no hay cupos', texto: `Todas las horas del ${rango} están tomadas.` };
  }
  return { titulo: 'Esta semana no hay cupos', texto: `Del ${rango} la ortodoncista no atiende o ya no quedan horas.` };
}

const Flecha = ({ lado }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path
      d={lado === 'izq' ? 'M12.500 4.500 7 10l5.500 5.500' : 'M7.500 4.500 13 10l-5.500 5.500'}
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

function SkeletonDias() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Cargando disponibilidad…</span>
      <div className="dias" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="dia skeleton-card"><span className="sk sk-l" /><span className="sk sk-n" /><span className="sk sk-l" /></div>
        ))}
      </div>
      <div className="horas-skel" aria-hidden="true">
        <span className="sk sk-t" />
        <div className="chips">{Array.from({ length: 6 }, (_, i) => <span key={i} className="sk sk-chip" />)}</div>
      </div>
    </div>
  );
}

function Dias({ data, fecha, onElegir }) {
  const refs = useRef([]);
  const contenedor = useRef(null);

  // En móvil la fila se desplaza: el día elegido debe quedar a la vista.
  useEffect(() => {
    const c = contenedor.current;
    const activo = c && c.querySelector('.dia.activo');
    if (!activo || c.scrollWidth <= c.clientWidth) return;
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    c.scrollTo({ left: activo.offsetLeft - (c.clientWidth - activo.offsetWidth) / 2, behavior: suave ? 'smooth' : 'auto' });
  }, [fecha]);

  const maxSlots = Math.max(1, ...data.dias.map((d) => d.slots.length));

  const onKeyDown = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const habilitados = refs.current.filter((b) => b && !b.disabled);
    const i = habilitados.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const destino = e.key === 'Home' ? 0
      : e.key === 'End' ? habilitados.length - 1
      : Math.min(habilitados.length - 1, Math.max(0, i + (e.key === 'ArrowRight' ? 1 : -1)));
    habilitados[destino].focus();
  };

  return (
    <div className="dias" role="group" aria-label="Días de la semana" onKeyDown={onKeyDown} ref={contenedor}>
      {data.dias.map((d, i) => {
        const p = partesFecha(d.fecha);
        const n = d.slots.length;
        const activo = d.fecha === fecha;
        const motivo = motivoDe(d);
        // Con horas, la barra muestra cuánto hay libre; "sin cupo" la muestra llena (todo tomado).
        const pct = n ? Math.max(10, Math.round((n / maxSlots) * 100)) : motivo === 'sin_cupo' ? 100 : 0;
        return (
          <button
            key={d.fecha}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            className={`dia${activo ? ' activo' : ''}${n ? '' : ` sin-${motivo}`}`}
            disabled={!n}
            aria-pressed={activo}
            aria-label={`${capitalizar(p.nombreDia)} ${p.dia} de ${p.mes}, ${n ? `${n} ${n === 1 ? 'hora libre' : 'horas libres'}` : ESTADOS[motivo].aria}`}
            onClick={() => onElegir(d.fecha)}
          >
            <span className="dia-nombre">{p.nombreCorto}</span>
            <span className="dia-num">{p.dia}</span>
            <span className="dia-cupo">{n ? `${n} ${n === 1 ? 'hora' : 'horas'}` : ESTADOS[motivo].texto}</span>
            <span className="dia-barra" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
          </button>
        );
      })}
    </div>
  );
}

function Horas({ slots, hora, onElegir }) {
  const grupos = [
    ['Mañana', slots.filter((s) => horaAMin(s) < 720)],
    ['Tarde', slots.filter((s) => horaAMin(s) >= 720)],
  ].filter(([, lista]) => lista.length);
  return (
    <div className="horas">
      {grupos.map(([titulo, lista]) => (
        <section key={titulo} aria-labelledby={`g-${titulo}`}>
          <h4 id={`g-${titulo}`} className="grupo-titulo">{titulo}</h4>
          <div className="chips">
            {lista.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip${s === hora ? ' activo' : ''}`}
                aria-pressed={s === hora}
                aria-label={`${hora12(s)}, ${titulo === 'Mañana' ? 'de la mañana' : 'de la tarde'}`}
                onClick={() => onElegir(s)}
              >
                {hora12(s)}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function FechaStep({
  servicio, semana, fecha, hora, rango, aviso, onSemana, onFecha, onHora, onAtras, onSiguiente,
}) {
  const { status, data, recargar } = useSemana(servicio.id, semana);
  const [dir, setDir] = useState(0);
  const [diaPref, setDiaPref] = useState(fecha ? indiceDia(fecha) : null);
  const [buscando, setBuscando] = useState(false);
  const [msgBusqueda, setMsgBusqueda] = useState('');

  const esPrimera = semana <= rango.min;
  const esUltima = semana >= rango.max;

  const irA = (nueva) => {
    if (nueva < rango.min || nueva > rango.max || nueva === semana) return;
    setDir(nueva > semana ? 1 : -1);
    setMsgBusqueda('');
    onSemana(nueva);
  };

  // Al cambiar de semana se conserva el día de la semana elegido si tiene cupo.
  useEffect(() => {
    if (status !== 'ok' || fecha || diaPref == null) return;
    const d = data.dias[diaPref];
    if (d && d.slots.length) onFecha(d.fecha);
  }, [status, data, fecha, diaPref]); // eslint-disable-line react-hooks/exhaustive-deps

  const elegirDia = (f) => {
    setDiaPref(indiceDia(f));
    onFecha(f);
  };

  const primerCupo = async () => {
    setBuscando(true);
    setMsgBusqueda('');
    try {
      const s = await buscarPrimerCupo(servicio.id, rango.min, rango.max);
      if (!s) setMsgBusqueda('No hay cupos en las próximas 8 semanas. Intenta con otro servicio o llámanos.');
      else if (s === semana) setMsgBusqueda('Ya estás en la semana con el primer cupo.');
      else irA(s);
    } catch {
      setMsgBusqueda('No pudimos consultar la disponibilidad. Intenta de nuevo.');
    } finally {
      setBuscando(false);
    }
  };

  const dia = useMemo(() => (data ? data.dias.find((d) => d.fecha === fecha) : null), [data, fecha]);
  const vacia = status === 'ok' && !hayCupo(data);
  const vacioMsg = vacia ? mensajeSemanaVacia(data, formatRango(semana)) : null;

  return (
    <div className="paso">
      <h2 className="paso-titulo">Elige semana, día y hora</h2>
      <p className="paso-sub">
        {servicio.nombre} · {servicio.duracion_min} min · con {data ? data.profesional : 'tu ortodoncista'}
      </p>

      {USA_MOCK && <p className="demo" role="note"><span aria-hidden="true">●</span> Modo demo: datos de ejemplo</p>}
      {aviso && <p className="alerta" role="alert">{aviso}</p>}

      <div className="semana-nav">
        <button type="button" className="icono" aria-label="Semana anterior" disabled={esPrimera} onClick={() => irA(addDays(semana, -7))}>
          <Flecha lado="izq" />
        </button>
        <div className="semana-rango">
          <span className="semana-etiqueta">Semana</span>
          <strong aria-live="polite">{formatRango(semana)}</strong>
        </div>
        <button type="button" className="icono" aria-label="Semana siguiente" disabled={esUltima} onClick={() => irA(addDays(semana, 7))}>
          <Flecha lado="der" />
        </button>
      </div>

      <div className="atajo">
        <button type="button" className="enlace" onClick={primerCupo} disabled={buscando}>
          {buscando ? 'Buscando…' : 'Ir a la semana con el primer cupo'}
        </button>
        {msgBusqueda && <span className="atajo-msg" role="status">{msgBusqueda}</span>}
      </div>

      <div className="semana-panel" key={semana} style={{ '--dir': dir }} data-anim={dir !== 0}>
        {status === 'loading' && <SkeletonDias />}

        {status === 'error' && (
          <div className="estado" role="alert">
            <p className="estado-titulo">No pudimos cargar la disponibilidad</p>
            <p>Revisa tu conexión e inténtalo otra vez.</p>
            <button type="button" className="btn secundario" onClick={recargar}>Reintentar</button>
          </div>
        )}

        {vacia && (
          <div className="estado">
            <p className="estado-titulo">{vacioMsg.titulo}</p>
            <p>{vacioMsg.texto}</p>
            {!esUltima ? (
              <button type="button" className="btn secundario" onClick={() => irA(addDays(semana, 7))}>
                Ver la semana siguiente
              </button>
            ) : (
              <p>Es la última semana disponible. Prueba con una anterior.</p>
            )}
          </div>
        )}

        {status === 'ok' && !vacia && (
          <>
            <Dias data={data} fecha={fecha} onElegir={elegirDia} />
            <div className="horas-zona" aria-live="polite">
              {dia ? (
                <Horas key={dia.fecha} slots={dia.slots} hora={hora} onElegir={onHora} />
              ) : (
                <p className="pista">Elige un día para ver las horas disponibles.</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="acciones">
        <button type="button" className="btn fantasma" onClick={onAtras}>Atrás</button>
        <button type="button" className="btn primario" disabled={!fecha || !hora} onClick={onSiguiente}>Continuar</button>
      </div>
    </div>
  );
}
