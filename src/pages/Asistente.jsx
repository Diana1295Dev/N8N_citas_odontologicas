import { useRef, useState } from 'react';
import { USA_MOCK } from '../api/disponibilidad.js';
import { PROFESIONAL } from '../config.js';
import { ocupacionDe } from '../data/disponibilidad.mock.js';
import { guardarAgenda, horarioPersonalizado, restablecerAgenda } from '../data/horario.store.js';
import { limpiarCache } from '../hooks/semanas.js';
import {
  alternarDia as alternarNoAtiende, alternarSemana, componerAgenda, componerMarcas, diasDeSemana, errorPatron, MARCAS_VACIAS, noAtiende, PATRON_VACIO,
} from '../lib/agenda.js';
import {
  addDays, ahoraBogota, capitalizar, fechaLarga, formatRango, hora12, indiceDia, lunesDe, MESES, minAHora, parseISO, rangoSemanas, toISO,
} from '../lib/fechas.js';

const CLAVE_UI = 'citas.agenda.ui.v1';
const NOMBRES_DIA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
// Opciones de hora cada 30 min, de 6:00 a. m. a 9:00 p. m.
const HORAS = Array.from({ length: 31 }, (_, i) => 360 + i * 30);


const Hora = ({ value, onChange, etiqueta }) => (
  <select value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={etiqueta}>
    {HORAS.map((m) => <option key={m} value={m}>{hora12(minAHora(m))}</option>)}
  </select>
);

const mesDe = (fecha) => fecha.slice(0, 7);
const sumarMes = (mes, n) => {
  const d = parseISO(`${mes}-01`);
  return toISO(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))).slice(0, 7);
};

function leerUI() {
  try {
    const raw = localStorage.getItem(CLAVE_UI);
    if (raw && horarioPersonalizado()) {
      const ui = JSON.parse(raw);
      return {
        patron: ui.patron,
        // `cerradas` = formato anterior; las marcas «sin_cupo» viejas se descartan (ahora las calculan las reservas)
        marcas: { no_atiende: ui.marcas?.no_atiende || ui.cerradas || [] },
      };
    }
  } catch {
    /* sin datos previos */
  }
  return { patron: PATRON_VACIO, marcas: MARCAS_VACIAS };
}

export default function Asistente() {
  const ahora = ahoraBogota();
  const hoy = ahora.fecha;
  const maxFecha = addDays(rangoSemanas(ahora).max, 5); // hasta donde las pacientes pueden agendar

  const [inicial] = useState(leerUI);
  const [patron, setPatron] = useState(inicial.patron);
  const [marcas, setMarcas] = useState(inicial.marcas);
  const [mes, setMes] = useState(mesDe(hoy));
  const [estado, setEstado] = useState({ tipo: 'vacio', texto: '' });
  const celdas = useRef({});

  // Cada cambio se guarda solo: así no hay un botón que recordar.
  const aplicar = (nuevoPatron, nuevasMarcas) => {
    setPatron(nuevoPatron);
    setMarcas(nuevasMarcas);
    const err = errorPatron(nuevoPatron);
    if (err) {
      setEstado({ tipo: 'error', texto: `${err} Aún no se guardó.` });
      return;
    }
    guardarAgenda(
      componerAgenda(nuevoPatron, nuevasMarcas, hoy, maxFecha),
      componerMarcas(nuevoPatron, nuevasMarcas, hoy, maxFecha),
    );
    try {
      localStorage.setItem(CLAVE_UI, JSON.stringify({ patron: nuevoPatron, marcas: nuevasMarcas }));
    } catch {
      /* sin almacenamiento */
    }
    limpiarCache(); // la paciente debe ver la agenda nueva de inmediato
    setEstado({
      tipo: nuevoPatron.dias.length ? 'ok' : 'aviso',
      texto: nuevoPatron.dias.length
        ? 'Guardado. Las pacientes ya ven esta agenda.'
        : 'Guardado, pero no hay días marcados: las pacientes no verán horarios.',
    });
  };

  const alternarDia = (i) =>
    aplicar({ ...patron, dias: patron.dias.includes(i) ? patron.dias.filter((d) => d !== i) : [...patron.dias, i].sort() }, marcas);
  const cambiarPeriodo = (k, campo, v) => aplicar({ ...patron, [k]: { ...patron[k], [campo]: v } }, marcas);
  const marcarDia = (f) => aplicar(patron, alternarNoAtiende(marcas, f));
  const marcarSemana = (fechas) => aplicar(patron, alternarSemana(marcas, fechas));
  const empezarDeNuevo = () => {
    restablecerAgenda();
    limpiarCache();
    try {
      localStorage.removeItem(CLAVE_UI);
    } catch {
      /* nada */
    }
    setPatron(PATRON_VACIO);
    setMarcas(MARCAS_VACIAS);
    setEstado({ tipo: 'aviso', texto: 'Se borró lo marcado y volvió la agenda de ejemplo.' });
  };

  // ----- calendario -----
  const huecos = indiceDia(`${mes}-01`); // lunes = 0
  const diasMes = new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5, 7), 0)).getUTCDate();
  const fechasMes = Array.from({ length: diasMes }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`);
  const atiendeEseDia = (f) => f >= hoy && f <= maxFecha && indiceDia(f) <= 5 && patron.dias.includes(indiceDia(f));

  // Una fila = lunes a sábado + el botón "Toda" de esa semana (ocupa el lugar del domingo, que nunca se atiende).
  const celdasMes = [];
  fechasMes.forEach((f) => {
    if (indiceDia(f) === 6) celdasMes.push({ semana: lunesDe(f) });
    else celdasMes.push({ dia: f });
  });
  const ultimo = fechasMes[fechasMes.length - 1];
  if (indiceDia(ultimo) !== 6) {
    for (let i = indiceDia(ultimo) + 1; i < 6; i++) celdasMes.push({ vacio: `f${i}` });
    celdasMes.push({ semana: lunesDe(ultimo) });
  }

  const onKey = (e, f) => {
    const paso = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!paso) return;
    e.preventDefault();
    let destino = addDays(f, paso);
    while (!atiendeEseDia(destino) && destino > hoy && destino < maxFecha) destino = addDays(destino, paso > 0 ? 1 : -1);
    if (!atiendeEseDia(destino)) return;
    if (mesDe(destino) !== mes) setMes(mesDe(destino));
    setTimeout(() => celdas.current[destino]?.focus(), 0);
  };

  return (
    <section className="panel asistente">
      <h1 className="paso-titulo">Agenda de la ortodoncista</h1>
      <p className="paso-sub">
        Marca cuándo atiende {PROFESIONAL}. Las pacientes solo verán esos días y horas. Todo se guarda solo.
      </p>
      {USA_MOCK && (
        <p className="demo" role="note"><span aria-hidden="true">●</span> Modo demo: se guarda solo en este navegador</p>
      )}

      <h2 className="paso-num"><span aria-hidden="true">1</span><span>¿Qué días atiende normalmente?</span></h2>
      <p className="paso-sub">Toca los días de la semana en que la doctora atiende de forma habitual. Se repiten todas las semanas.</p>
      <div className="chips-dias" role="group" aria-label="Días que atiende normalmente">
        {NOMBRES_DIA.map((n, i) => (
          <button key={n} type="button" className={`chip${patron.dias.includes(i) ? ' activo' : ''}`} aria-pressed={patron.dias.includes(i)} onClick={() => alternarDia(i)}>
            {capitalizar(n)}
          </button>
        ))}
      </div>

      <h2 className="paso-num"><span aria-hidden="true">2</span><span>¿En qué horario atiende esos días?</span></h2>
      <p className="paso-sub">Activa la mañana, la tarde o las dos, y elige desde qué hora hasta qué hora.</p>
      <div className="horario">
        {[['manana', 'Mañana'], ['tarde', 'Tarde']].map(([k, nombre]) => (
          <div key={k} className={`periodo${patron[k].on ? '' : ' apagado'}`}>
            <label className="periodo-check">
              <input type="checkbox" checked={patron[k].on} onChange={(e) => cambiarPeriodo(k, 'on', e.target.checked)} />
              <span>{nombre}</span>
            </label>
            <label className="bloque-et">Desde<Hora value={patron[k].ini} etiqueta={`${nombre}: hora de inicio`} onChange={(v) => cambiarPeriodo(k, 'ini', v)} /></label>
            <label className="bloque-et">Hasta<Hora value={patron[k].fin} etiqueta={`${nombre}: hora de fin`} onChange={(v) => cambiarPeriodo(k, 'fin', v)} /></label>
          </div>
        ))}
      </div>

      <h2 className="paso-num"><span aria-hidden="true">3</span><span>¿Qué semanas no atiende la doctora? <em>(opcional)</em></span></h2>
      <p className="paso-sub">
        Toca «Toda» para marcar la semana completa como «No atiende», o un solo día si es un festivo. Toca otra vez para quitarlo.
      </p>
      <p className="nota-auto">
        <span className="punto sincupo" aria-hidden="true" />
        <span><strong>«Sin cupo» se marca solo</strong> cuando las pacientes llenan todas las horas de un día. No tienes que hacer nada.</span>
      </p>

      <div className="cal">
        <div className="cal-nav">
          <button type="button" className="icono" aria-label="Mes anterior" disabled={mes <= mesDe(hoy)} onClick={() => setMes(sumarMes(mes, -1))}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M12.500 4.500 7 10l5.500 5.500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <strong className="cal-mes" aria-live="polite">{capitalizar(MESES[+mes.slice(5, 7) - 1])} {mes.slice(0, 4)}</strong>
          <button type="button" className="icono" aria-label="Mes siguiente" disabled={mes >= mesDe(maxFecha)} onClick={() => setMes(sumarMes(mes, 1))}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M7.500 4.500 13 10l-5.500 5.500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <div className="cal-sem" aria-hidden="true">{[...SEMANA, 'Semana'].map((d) => <span key={d}>{d}</span>)}</div>
        <div className="cal-dias" role="group" aria-label="Días del mes">
          {Array.from({ length: huecos }, (_, i) => <span key={`h${i}`} />)}
          {celdasMes.map((c) => {
            if (c.vacio) return <span key={c.vacio} />;
            if (c.semana) {
              const fechas = diasDeSemana(patron, c.semana, hoy, maxFecha);
              const marcada = fechas.length > 0 && fechas.every((f) => noAtiende(marcas, f));
              const rango = formatRango(c.semana);
              return (
                <button
                  key={`s${c.semana}`}
                  type="button"
                  disabled={!fechas.length}
                  aria-pressed={marcada}
                  aria-label={`${marcada ? 'Quitar' : 'Marcar'} «No atiende» en toda la semana del ${rango}`}
                  className={`cal-semana no_atiende${marcada ? ' marcada' : ''}`}
                  onClick={() => marcarSemana(fechas)}
                >
                  Toda
                </button>
              );
            }
            const f = c.dia;
            const atiende = atiendeEseDia(f);
            const cerrado = atiende && noAtiende(marcas, f);
            const ocup = atiende && !cerrado ? ocupacionDe(f) : null;
            const lleno = Boolean(ocup?.lleno);
            const citas = ocup?.citas || 0;
            const estadoTxt = cerrado ? 'no atiende' : lleno ? 'sin cupo, las pacientes llenaron el día' : citas ? `disponible, ${citas} cita${citas === 1 ? '' : 's'} reservada${citas === 1 ? '' : 's'}` : 'disponible';
            return (
              <button
                key={f}
                ref={(el) => { celdas.current[f] = el; }}
                type="button"
                disabled={!atiende}
                aria-pressed={cerrado}
                aria-label={atiende
                  ? `${fechaLarga(f)}: ${estadoTxt}. Toca para ${cerrado ? 'quitar «No atiende»' : 'marcar «No atiende»'}`
                  : `${fechaLarga(f)}: sin atención`}
                className={`cal-dia${atiende && !cerrado && !lleno ? ' con' : ''}${cerrado ? ' cerrado' : ''}${lleno ? ' sincupo' : ''}${f === hoy ? ' hoy' : ''}`}
                onClick={() => marcarDia(f)}
                onKeyDown={(e) => onKey(e, f)}
              >
                <span className="cal-num">{+f.slice(8)}</span>
                <span className="cal-hrs" aria-hidden="true">{cerrado ? 'No atiende' : lleno ? 'Sin cupo' : citas ? `${citas} cita${citas === 1 ? '' : 's'}` : ''}</span>
              </button>
            );
          })}
        </div>
        <p className="cal-leyenda">
          <span className="punto" aria-hidden="true" /> Disponible
          <span className="punto cerrado" aria-hidden="true" /> No atiende
          <span className="punto sincupo" aria-hidden="true" /> Sin cupo (automático)
        </p>
      </div>

      <div className={`guardado ${estado.tipo}`} role="status" aria-live="polite">
        {estado.tipo === 'ok' && <span aria-hidden="true">✓ </span>}
        {estado.texto || 'Los cambios se guardan automáticamente.'}
      </div>
      <p className="ver-paciente">
        <a className="enlace" href="#/paciente">Ver cómo la ve la paciente →</a>
        <button type="button" className="enlace" onClick={empezarDeNuevo}>Empezar de nuevo</button>
      </p>
    </section>
  );
}
