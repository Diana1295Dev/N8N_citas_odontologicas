import { useEffect, useMemo, useState } from 'react';
import { USA_MOCK } from '../api/disponibilidad.js';
import { CLAVE_RESERVAS, cancelarReserva, recargarReservas, todasLasReservas } from '../data/reservas.store.js';
import { limpiarCache } from '../hooks/semanas.js';
import { addDays, ahoraBogota, capitalizar, fechaLarga, hora12, horaAMin, minAHora, partesFecha } from '../lib/fechas.js';

const FILTROS = [
  ['hoy', 'Hoy'],
  ['semana', 'Próximos 7 días'],
  ['proximas', 'Todas las próximas'],
  ['pasadas', 'Pasadas'],
];

const Icono = ({ d, size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const I = {
  tel: 'M5 4h3.5l1.5 4.5-2 1.5a11 11 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  wa: 'M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20zM9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2L9 9.5z',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  descargar: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  hoy: 'M7 3v4M17 3v4M3.5 10h17M5.5 5h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM12 14h.01',
  semana: 'M7 3v4M17 3v4M3.5 10h17M5.5 5h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM7.5 14h9M7.5 17.5h5',
  lista: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  reloj: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 7.5V12l3 2',
  buscar: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5L20 20',
  basura: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5',
  nota: 'M5 4h14v12l-4 4H5zM15 20v-4h4',
  vacio: 'M7 3v4M17 3v4M3.5 10h17M5.5 5h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9.5 14.5l5 0',
};

const finDe = (c) => horaAMin(c.hora) + c.duracion_min;
const iniciales = (nombre) => (nombre || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const telBonito = (t) => t.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');

function faltan(min) {
  if (min < 1) return 'ahora';
  if (min < 60) return `en ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return `en ${h} h${m ? ` ${m} min` : ''}`;
  const d = Math.round(h / 24);
  return d === 1 ? 'mañana' : `en ${d} días`;
}

function saludo(minutos) {
  if (minutos < 720) return 'Buenos días';
  if (minutos < 1140) return 'Buenas tardes';
  return 'Buenas noches';
}

function descargarCSV(citas) {
  const cols = ['fecha', 'hora', 'duracion_min', 'servicio_nombre', 'nombre', 'telefono', 'email', 'notas'];
  const celda = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const texto = [cols.join(','), ...citas.map((c) => cols.map((k) => celda(c[k])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([`﻿${texto}`], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'citas.csv' });
  a.click();
  URL.revokeObjectURL(url);
}

export default function TableroCitas({ onCambio }) {
  const [citas, setCitas] = useState(todasLasReservas);
  const [filtro, setFiltro] = useState('proximas');
  const [buscar, setBuscar] = useState('');
  const [aviso, setAviso] = useState('');

  // Si una paciente reserva en otra pestaña de este navegador, el tablero se actualiza solo.
  useEffect(() => {
    const alCambiar = (e) => {
      if (e.key !== CLAVE_RESERVAS) return;
      recargarReservas();
      limpiarCache();
      setCitas(todasLasReservas());
      onCambio?.();
    };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ahora = ahoraBogota();
  const hoy = ahora.fecha;
  const en7 = addDays(hoy, 6);
  const pasada = (c) => c.fecha < hoy || (c.fecha === hoy && finDe(c) <= ahora.minutos);
  const proximas = citas.filter((c) => !pasada(c));
  const siguiente = proximas[0];
  const minHasta = (c) => {
    const dias = Math.round((Date.parse(c.fecha) - Date.parse(hoy)) / 86400000);
    return dias * 1440 + horaAMin(c.hora) - ahora.minutos;
  };

  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    let l = {
      hoy: citas.filter((c) => c.fecha === hoy),
      semana: proximas.filter((c) => c.fecha <= en7),
      proximas,
      pasadas: citas.filter(pasada).reverse(),
    }[filtro];
    if (q) l = l.filter((c) => [c.nombre, c.telefono, c.email, c.servicio_nombre].some((v) => v && v.toLowerCase().includes(q)));
    return l;
  }, [citas, filtro, buscar]); // eslint-disable-line react-hooks/exhaustive-deps

  const grupos = [];
  visibles.forEach((c) => {
    const g = grupos[grupos.length - 1];
    if (g && g.fecha === c.fecha) g.citas.push(c);
    else grupos.push({ fecha: c.fecha, citas: [c] });
  });

  const cancelar = (c) => {
    const quien = c.nombre || 'esta reserva';
    if (!window.confirm(`¿Cancelar la cita de ${quien} el ${fechaLarga(c.fecha).toLowerCase()} a las ${hora12(c.hora)}?\n\nLa hora vuelve a quedar libre para otras pacientes.`)) return;
    cancelarReserva(c.id);
    limpiarCache();
    setCitas(todasLasReservas());
    onCambio?.();
    setAviso(`Se canceló la cita de ${quien}. Esa hora ya está libre otra vez.`);
  };

  const kpis = [
    ['hoy', 'Citas hoy', citas.filter((c) => c.fecha === hoy).length, I.hoy],
    ['semana', 'Próximos 7 días', proximas.filter((c) => c.fecha <= en7).length, I.semana],
    ['total', 'Próximas en total', proximas.length, I.lista],
  ];

  return (
    <section className="panel tablero" aria-labelledby="t-tablero">
      <div className="tablero-cab">
        <div>
          <p className="tablero-saludo">{saludo(ahora.minutos)} · {fechaLarga(hoy)}</p>
          <h1 id="t-tablero" className="paso-titulo">Citas confirmadas</h1>
          <p className="paso-sub">Todas las citas que las pacientes han reservado, con sus datos de contacto.</p>
        </div>
        <button type="button" className="btn fantasma btn-chico" onClick={() => descargarCSV(visibles)} disabled={!visibles.length}>
          <Icono d={I.descargar} /> Descargar Excel
        </button>
      </div>
      {USA_MOCK && (
        <p className="demo" role="note"><span aria-hidden="true">●</span> Modo demo: aquí solo aparecen las citas hechas en este navegador</p>
      )}

      <div className="kpis">
        {kpis.map(([id, t, n, icono]) => (
          <div key={id} className={`kpi kpi-${id}`}>
            <span className="kpi-ico"><Icono d={icono} size={20} /></span>
            <span className="kpi-n">{n}</span>
            <span className="kpi-t">{t}</span>
          </div>
        ))}
        <div className="kpi kpi-sig">
          <span className="kpi-t">Siguiente cita</span>
          {siguiente ? (
            <>
              <span className="kpi-sig-hora">{hora12(siguiente.hora)}</span>
              <span className="kpi-sig-txt">{siguiente.nombre || 'Reserva sin datos'} · {siguiente.fecha === hoy ? 'hoy' : fechaLarga(siguiente.fecha).toLowerCase()}</span>
              <span className="kpi-falta"><Icono d={I.reloj} size={15} />{faltan(minHasta(siguiente))}</span>
            </>
          ) : <span className="kpi-sig-txt">No hay citas próximas</span>}
        </div>
      </div>

      <div className="tablero-filtros">
        <div className="segmentos" role="group" aria-label="Qué citas mostrar">
          {FILTROS.map(([id, t]) => (
            <button key={id} type="button" className={`segmento${filtro === id ? ' activo' : ''}`} aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{t}</button>
          ))}
        </div>
        <label className="buscador">
          <span className="sr-only">Buscar paciente</span>
          <Icono d={I.buscar} />
          <input type="search" placeholder="Buscar por nombre, celular o correo" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        </label>
      </div>

      {aviso && <p className="guardado ok tablero-aviso" role="status">✓ {aviso}</p>}

      {!grupos.length ? (
        <div className="tablero-vacio">
          <span className="tablero-vacio-ico"><Icono d={I.vacio} size={34} /></span>
          <p className="estado-titulo">{buscar ? 'Ninguna cita coincide con la búsqueda' : 'No hay citas en esta vista'}</p>
          <p>Cuando una paciente confirme su cita, aparecerá aquí al instante.</p>
        </div>
      ) : (
        grupos.map((g) => {
          const p = partesFecha(g.fecha);
          return (
            <div key={g.fecha} className="tablero-dia">
              <h2 className="tablero-fecha">
                <span className="hoja" aria-hidden="true"><span className="hoja-mes">{p.mes.slice(0, 3)}</span><span className="hoja-dia">{p.dia}</span></span>
                <span className="tablero-fecha-txt">
                  <span>{capitalizar(p.nombreDia)}{g.fecha === hoy && <span className="etq-hoy">Hoy</span>}</span>
                  <small>{p.dia} de {p.mes} · {g.citas.length} cita{g.citas.length === 1 ? '' : 's'}</small>
                </span>
              </h2>
              <ul className="citas-lista">
                {g.citas.map((c) => {
                  const yaPaso = pasada(c);
                  const tel = (c.telefono || '').replace(/\D/g, '');
                  return (
                    <li key={c.id} className={`cita-fila srv-${c.servicio || 'otro'}${yaPaso ? ' pasada' : ''}`}>
                      <div className="cita-hora">
                        <strong>{hora12(c.hora)}</strong>
                        <span>a {hora12(minAHora(finDe(c)))}</span>
                      </div>
                      <div className="cita-cuerpo">
                        <div className="cita-persona">
                          <span className="avatar-ini" aria-hidden="true">{iniciales(c.nombre)}</span>
                          <div className="cita-info">
                            <p className="cita-nombre">{c.nombre || 'Reserva sin datos'}</p>
                            <p className="cita-serv"><span className="srv-punto" aria-hidden="true" />{c.servicio_nombre || 'Servicio no indicado'} · {c.duracion_min} min</p>
                            {(tel || c.email) && (
                              <p className="cita-datos-txt">{[tel && telBonito(tel), c.email].filter(Boolean).join(' · ')}</p>
                            )}
                          </div>
                        </div>
                        {c.notas && <p className="cita-notas"><Icono d={I.nota} size={15} />{c.notas}</p>}
                        <div className="cita-pie">
                          <span className={`etq-estado${yaPaso ? ' pasada' : ''}`}>{yaPaso ? 'Ya pasó' : 'Confirmada'}</span>
                          <span className="cita-botones">
                            {tel && <a className="boton-redondo" href={`tel:+57${tel}`} aria-label={`Llamar a ${c.nombre}`} title="Llamar"><Icono d={I.tel} /></a>}
                            {tel && <a className="boton-redondo wa" href={`https://wa.me/57${tel}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp a ${c.nombre}`} title="WhatsApp"><Icono d={I.wa} /></a>}
                            {c.email && <a className="boton-redondo" href={`mailto:${c.email}`} aria-label={`Correo a ${c.nombre}`} title="Correo"><Icono d={I.mail} /></a>}
                            {!yaPaso && (
                              <button type="button" className="boton-cancelar" onClick={() => cancelar(c)} aria-label={`Cancelar la cita de ${c.nombre || 'esta reserva'}`}>
                                <Icono d={I.basura} size={16} /><span>Cancelar</span>
                              </button>
                            )}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
