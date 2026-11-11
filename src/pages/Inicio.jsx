import { useEffect, useRef, useState } from 'react';
import { irASeccion } from '../components/Cabecera.jsx';
import Aurora from '../components/Aurora.jsx';
import LupaSonrisa from '../components/LupaSonrisa.jsx';
import { ANTICIPACION_MIN, CLINICA, DIRECCION, PROFESIONAL, SEMANAS_MAX, SERVICIOS } from '../config.js';
import { cargarSemana } from '../hooks/semanas.js';
import { useAparecer, useArrastre, useDistancia, useInclinar3D, useMagnetico, useParallax, useProgreso } from '../hooks/movimiento.js';
import { addDays, ahoraBogota, fechaLarga, hora12, rangoSemanas } from '../lib/fechas.js';

const IMG = `${import.meta.env.BASE_URL}img/`;
// Silueta de un diente (lienzo 200 × 240): la foto de la portada se recorta con esta forma
const FORMA_DIENTE = 'M100 26C78 10 36 10 24 46c-10 32 4 62 14 98 9 36 14 82 34 84 18 2 18-42 28-62 10 20 10 64 28 62 20-2 25-48 34-84 10-36 24-66 14-98C164 10 122 10 100 26z';
const FOTO_SERVICIO = {
  valoracion: ['valoracion.webp', 'Radiografía dental revisada en una tableta'],
  limpieza: ['limpieza.webp', 'Cepillos dentales en un vaso de vidrio'],
  blanqueamiento: ['blanqueamiento.webp', 'Revisión de una sonrisa con instrumental dental'],
  ortodoncia: ['ortodoncia.webp', 'Paciente colocándose un alineador transparente'],
};

const Icono = ({ d, size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const I = {
  calendario: 'M7 3v4M17 3v4M3.5 10h17M5.5 5h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9 15l2 2 4-4',
  reloj: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 7.5V12l3 2',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  brackets: 'M3 9.5c3 2 15 2 18 0M3 14.5c3-2 15-2 18 0M6.5 8.5v7M12 9v6M17.5 8.5v7',
  escudo: 'M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3zM8.5 12l2.5 2.5 4.5-4.5',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  usuario: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4.5 20.5c.8-3.6 3.7-6 7.5-6s6.7 2.4 7.5 6',
  externo: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
};

const PASOS = [
  ['Elige el servicio', 'Valoración, limpieza, blanqueamiento o control de ortodoncia. Cada uno indica cuánto dura.'],
  ['Escoge día y hora', 'Ves la agenda real de la doctora, semana por semana, solo con las horas que están libres.'],
  ['Confirma tu cita', 'Recibes la confirmación al instante y puedes guardarla en tu calendario.'],
];

const PREGUNTAS = [
  ['¿Necesito crear una cuenta para agendar?', 'No. Eliges el servicio, el día y la hora, y escribes tu nombre, celular y correo. Nada más.'],
  ['¿Cómo sé que mi cita quedó confirmada?', 'Al terminar ves la confirmación en pantalla y puedes descargar la cita para tu calendario (Google, Outlook o iPhone).'],
  ['¿Cuánto dura cada cita?', `Depende del servicio: ${SERVICIOS.map((x) => `${x.nombre.toLowerCase()}, ${x.duracion_min} min`).join('; ')}.`],
  ['¿Con cuánta anticipación puedo reservar?', `Puedes ver y reservar hasta ${SEMANAS_MAX} semanas adelante, y como mínimo con ${ANTICIPACION_MIN / 60} hora de anticipación.`],
  ['¿Qué pasa si alguien toma la hora antes que yo?', 'La agenda se actualiza sola. Si la hora ya no está libre, te avisamos y te mostramos las horas disponibles para que elijas otra.'],
];

function Preguntas() {
  const [abierta, setAbierta] = useState(0);
  return (
    <div className="faq">
      {PREGUNTAS.map(([p, r], i) => {
        const abierto = abierta === i;
        return (
          <div key={p} className={`faq-item aparecer${abierto ? ' abierto' : ''}`} style={{ '--d': `${i * 70}ms` }}>
            <h3>
              <button type="button" className="faq-pregunta" aria-expanded={abierto} aria-controls={`faq-${i}`} id={`faq-p-${i}`} onClick={() => setAbierta(abierto ? -1 : i)}>
                {p}
                <span className="faq-mas" aria-hidden="true" />
              </button>
            </h3>
            <div className="faq-respuesta" id={`faq-${i}`} role="region" aria-labelledby={`faq-p-${i}`}>
              <div><p>{r}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const MANIFIESTO = 'Creemos que una sonrisa sana empieza con información clara, citas puntuales y un trato cercano en cada control.'.split(' ');

const ETAPAS = [
  ['Valoración', 'Revisamos tu mordida, resolvemos tus dudas y definimos si necesitas tratamiento.', 'valoracion.webp', 'Radiografía dental en una tableta'],
  ['Plan de tratamiento', 'Te explicamos las opciones, brackets o alineadores, con tiempos estimados y por escrito.', 'blanqueamiento.webp', 'Revisión de la sonrisa con instrumental dental'],
  ['Controles', 'Ajustes periódicos para que los dientes se muevan, poco a poco, a su lugar.', 'ortodoncia.webp', 'Paciente con un alineador transparente'],
  ['Retención', 'Al terminar, los retenedores ayudan a conservar el resultado en el tiempo.', 'limpieza.webp', 'Cepillos dentales para el cuidado diario'],
];

const GALERIA = [
  ['consultorio.webp', 'Sala de tratamiento con sillón y lámpara dental', 'Sala de tratamiento', 'alta'],
  ['valoracion.webp', 'Radiografía revisada en una tableta', 'Diagnóstico digital', ''],
  ['sala.webp', 'Sillón odontológico y equipos del consultorio', 'Equipos', 'alta'],
  ['ortodoncia.webp', 'Paciente con un alineador transparente', 'Alineadores', ''],
  ['blanqueamiento.webp', 'Revisión de una sonrisa con instrumental', 'Revisión', 'alta'],
  ['limpieza.webp', 'Cepillos dentales en un vaso de vidrio', 'Cuidado en casa', ''],
];

// Mapa de Tunja (OpenStreetMap). Cuando tengas la dirección exacta, centra aquí el consultorio.
const MAPA = 'https://www.openstreetmap.org/export/embed.html?bbox=-73.3760%2C5.5280%2C-73.3600%2C5.5420&layer=mapnik';
const MAPA_GRANDE = 'https://www.openstreetmap.org/#map=16/5.5350/-73.3680';

/** Primer cupo libre real de la agenda (undefined mientras busca, null si no hay). */
function useProximoCupo(servicio) {
  const [cupo, setCupo] = useState(undefined);
  useEffect(() => {
    let vivo = true;
    (async () => {
      const { min, max } = rangoSemanas(ahoraBogota());
      for (let s = min; s <= max; s = addDays(s, 7)) {
        const semana = await cargarSemana(servicio, s);
        const dia = semana.dias.find((d) => d.slots.length);
        if (dia) {
          if (vivo) setCupo({ fecha: dia.fecha, hora: dia.slots[0] });
          return;
        }
      }
      if (vivo) setCupo(null);
    })().catch(() => vivo && setCupo(null));
    return () => {
      vivo = false;
    };
  }, [servicio]);
  return cupo;
}

export default function Inicio() {
  const raiz = useAparecer();
  useParallax(raiz);
  useInclinar3D(raiz);
  useMagnetico(raiz);
  const manifiesto = useRef(null);
  const viaje = useRef(null);
  const viajeSticky = useRef(null);
  const pista = useRef(null);
  const gigante = useRef(null);
  useProgreso(manifiesto);
  useProgreso(viaje, 'fijo');
  useDistancia(viajeSticky, pista);
  useProgreso(gigante);
  const galeria = useRef(null);
  useArrastre(galeria);
  // Isla flotante de reserva: aparece al dejar atrás la portada
  const hero = useRef(null);
  const [verIsla, setVerIsla] = useState(false);
  useEffect(() => {
    const h = hero.current;
    if (!h || !('IntersectionObserver' in window)) return undefined;
    const obs = new IntersectionObserver(([e]) => setVerIsla(!e.isIntersecting), { threshold: 0.05 });
    obs.observe(h);
    return () => obs.disconnect();
  }, []);
  const cupo = useProximoCupo('valoracion');
  const hoy = ahoraBogota().fecha;

  useEffect(() => {
    const ir = new URLSearchParams(window.location.hash.split('?')[1]).get('ir');
    if (ir) document.getElementById(ir)?.scrollIntoView({ block: 'start' });
  }, []);

  return (
    <main className="landing" ref={raiz}>
      {/* ---------- Encabezado principal ---------- */}
      <section className="hero" ref={hero}>
        <div className="hero-luces" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="hero-grano" aria-hidden="true" />
        <p className="hero-palabra" aria-hidden="true">SONRISAS · SONRISAS ·</p>
        <div className="hero-grid">
          <div className="hero-texto">
            <p className="eyebrow">Ortodoncia en Tunja</p>
            <h1 className="hero-titulo">
              Una sonrisa{' '}
              <em className="destacado">
                alineada
                <svg className="trazo" viewBox="0 0 220 24" preserveAspectRatio="none" aria-hidden="true"><path d="M4 16C50 6 120 4 216 12" /></svg>
              </em>
              , con la atención que mereces
            </h1>
            <p className="hero-sub">
              Consulta de ortodoncia con la {PROFESIONAL}. Revisa la agenda real y reserva tu cita en línea, en menos de un minuto.
            </p>
            <div className="hero-acciones">
              <a className="btn primario btn-grande magnetico" href="#/paciente">Agendar cita <Icono d={I.flecha} /></a>
              <a className="btn contorno btn-grande" href="#/?ir=servicios" onClick={(e) => irASeccion(e, 'servicios')}>Ver servicios</a>
            </div>
            <ul className="hero-confianza">
              <li><Icono d={I.check} size={18} />Confirmación inmediata</li>
              <li><Icono d={I.check} size={18} />Cupos actualizados en línea</li>
              <li><Icono d={I.check} size={18} />Recordatorio para tu calendario</li>
            </ul>
          </div>

          <div className="hero-foto hero-lupa">
            <span className="onda-pulso o1" aria-hidden="true" />
            <span className="onda-pulso o2" aria-hidden="true" />
            <span className="onda-pulso o3" aria-hidden="true" />
            <div className="lupa-marco">
              <LupaSonrisa foto={`${IMG}sonrisa.webp`} alt="Sonrisa de una paciente colocándose un alineador transparente" />
              <svg className="diente-borde" viewBox="0 0 200 240" preserveAspectRatio="none" aria-hidden="true">
                <path d={FORMA_DIENTE} vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="cupo-card" aria-live="polite">
                <span className="cupo-ico"><Icono d={I.calendario} /></span>
                <span className="cupo-txt">
                  <span className="cupo-etq">Próximo cupo · valoración</span>
                  {cupo === undefined && <span className="cupo-valor cargando">Consultando la agenda…</span>}
                  {cupo === null && <span className="cupo-valor">Sin cupos en las próximas semanas</span>}
                  {cupo && (
                    <span className="cupo-valor">
                      {cupo.fecha === hoy ? 'Hoy' : fechaLarga(cupo.fecha)} · {hora12(cupo.hora)}
                    </span>
                  )}
                </span>
                {cupo && <a className="cupo-link" href="#/paciente?servicio=valoracion" aria-label="Reservar ese cupo"><Icono d={I.flecha} size={18} /></a>}
              </div>
            </div>
          </div>
        </div>
        <svg className="hero-ola" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 64C180 112 360 120 560 92S940 8 1140 22s240 44 300 58V120H0z" />
        </svg>
      </section>

      {/* ---------- Accesos ---------- */}
      <section className="seccion accesos" aria-labelledby="t-roles">
        <h2 id="t-roles" className="sr-only">¿Cómo quieres continuar?</h2>
        <div className="roles">
          <a className="rol rol-paciente" href="#/paciente">
            <span className="rol-icono"><Icono d={I.calendario} size={26} /></span>
            <span className="rol-cuerpo">
              <span className="rol-titulo">Soy paciente</span>
              <span className="rol-desc">Quiero agendar una cita eligiendo semana, día y hora disponibles.</span>
            </span>
            <span className="rol-flecha"><Icono d={I.flecha} /></span>
          </a>
          <a className="rol rol-asistente" href="#/asistente">
            <span className="rol-icono"><Icono d={I.usuario} size={26} /></span>
            <span className="rol-cuerpo">
              <span className="rol-titulo">Soy asistente del consultorio</span>
              <span className="rol-desc">Quiero ver las citas y cargar los días en que atiende la doctora.</span>
            </span>
            <span className="rol-flecha"><Icono d={I.flecha} /></span>
          </a>
        </div>
      </section>

      {/* ---------- Manifiesto que se colorea al bajar ---------- */}
      <section className="manifiesto" ref={manifiesto} style={{ '--n': MANIFIESTO.length }} aria-label="Nuestra forma de atender">
        <p className="manifiesto-txt">
          {MANIFIESTO.map((p, i) => <span key={i} style={{ '--i': i }}>{p} </span>)}
        </p>
        <p className="manifiesto-firma">— {CLINICA}, ortodoncia en Tunja</p>
      </section>

      {/* ---------- Servicios ---------- */}
      <div className="zona-oscura">
        <Aurora />
        <section id="servicios" className="seccion" aria-labelledby="t-servicios">
          <div className="seccion-cab aparecer tres-d">
            <p className="eyebrow">Servicios</p>
            <h2 id="t-servicios" className="seccion-titulo">Tratamientos para cada etapa de tu <em>sonrisa</em></h2>
            <p className="seccion-sub">Elige el que necesitas y agenda directamente; la duración ya está calculada en la agenda.</p>
          </div>
          <ul className="tarjetas">
            {SERVICIOS.map((s, i) => (
              <li key={s.id} className="aparecer tres-d" style={{ '--d': `${i * 90}ms` }}>
                <div className="tarjeta tilt" data-tilt="9">
                  <span className="brillo3d" aria-hidden="true" />
                  <div className="tarjeta-foto parallax revela" data-parallax="0.08">
                    <img src={`${IMG}${FOTO_SERVICIO[s.id][0]}`} alt={FOTO_SERVICIO[s.id][1]} width="720" height="480" loading="lazy" />
                    <span className="foto-accion" aria-hidden="true">Ver horarios <Icono d={I.flecha} size={16} /></span>
                  </div>
                  <div className="tarjeta-cuerpo">
                    <h3 className="tarjeta-titulo">{s.nombre}</h3>
                    <p className="tarjeta-desc">{s.descripcion}</p>
                    <div className="tarjeta-pie">
                      <span className="duracion"><Icono d={I.reloj} size={16} />{s.duracion_min} min</span>
                      <a className="enlace" href={`#/paciente?servicio=${s.id}`} aria-label={`Agendar ${s.nombre}`}>
                        Agendar <Icono d={I.flecha} size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ---------- Por qué agendar aquí ---------- */}
      <section className="mosaico-seccion" aria-labelledby="t-porque">
        <div className="seccion">
          <div className="seccion-cab aparecer tres-d">
            <p className="eyebrow">Por qué agendar aquí</p>
            <h2 id="t-porque" className="seccion-titulo">Tu cita, <em>sin llamadas</em> ni filas</h2>
          </div>
          <div className="mosaico">
            <article className="bloque bloque-foto aparecer tres-d">
              <div className="parallax revela" data-parallax="0.1"><img src={`${IMG}sala.webp`} alt="" width="1000" height="700" loading="lazy" /></div>
              <div className="bloque-foto-txt">
                <span className="etq-clara"><Icono d={I.pin} size={16} />Tunja, Boyacá</span>
                <h3>Un consultorio pensado para tu comodidad</h3>
              </div>
            </article>
            <article className="bloque bloque-agenda aparecer tres-d" style={{ '--d': '90ms' }}>
              <div className="mini-cal" aria-hidden="true">
                {['L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                  <span key={i} className={`mini-dia${[1, 3, 5].includes(i) ? ' libre' : ''}${i === 3 ? ' elegido' : ''}`}>{d}<i /></span>
                ))}
              </div>
              <h3>Agenda en tiempo real</h3>
              <p>Solo ves las horas que de verdad están libres, semana por semana.</p>
            </article>
            <article className="bloque bloque-check aparecer tres-d" style={{ '--d': '160ms' }}>
              <svg className="check-dibujo" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23" /><path d="M15 27l7 7 15-16" /></svg>
              <h3>Confirmación inmediata</h3>
              <p>Sabes al instante que tu cita quedó registrada.</p>
            </article>
            <article className="bloque bloque-cal aparecer tres-d" style={{ '--d': '230ms' }}>
              <span className="bloque-ico"><Icono d={I.calendario} size={24} /></span>
              <h3>Directo a tu calendario</h3>
              <p>Descarga la cita para Google, Outlook o iPhone y recibe el recordatorio.</p>
            </article>
            <article className="bloque bloque-plan aparecer tres-d" style={{ '--d': '300ms' }}>
              <span className="bloque-ico"><Icono d={I.escudo} size={24} /></span>
              <h3>Plan claro desde la primera cita</h3>
              <p>La valoración termina con un plan de tratamiento por escrito.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- Cómo funciona ---------- */}
      <section id="como-funciona" className="franja" aria-labelledby="t-como">
        <div className="seccion">
          <div className="seccion-cab aparecer">
            <p className="eyebrow">Cómo funciona</p>
            <h2 id="t-como" className="seccion-titulo">Reservar tu cita toma <em>tres pasos</em></h2>
          </div>
          <ol className="pasos-lista">
            {PASOS.map(([titulo, texto], i) => (
              <li key={titulo} className="paso-item aparecer giro" style={{ '--d': `${i * 140}ms` }}>
                <span className="paso-n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="tarjeta-titulo">{titulo}</h3>
                <p className="tarjeta-desc">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Etapas del tratamiento (desplazamiento horizontal) ---------- */}
      <section className="viaje" ref={viaje} style={{ '--etapas': ETAPAS.length }} aria-labelledby="t-viaje">
        <div className="viaje-sticky" ref={viajeSticky}>
          <div className="viaje-cab">
            <div>
              <p className="eyebrow">Tu tratamiento</p>
              <h2 id="t-viaje" className="seccion-titulo">De la primera cita a tu <em>nueva sonrisa</em></h2>
            </div>
            <div className="viaje-progreso" aria-hidden="true"><span /></div>
            <p className="viaje-ayuda" aria-hidden="true">Desliza para ver las etapas →</p>
          </div>
          <ol className="viaje-pista" ref={pista}>
            {ETAPAS.map(([titulo, texto, foto, alt], i) => (
              <li key={titulo} className="etapa">
                <div className="etapa-foto"><img src={`${IMG}${foto}`} alt={alt} width="720" height="480" loading="lazy" /></div>
                <div className="etapa-cuerpo">
                  <span className="etapa-n">Etapa {String(i + 1).padStart(2, '0')}</span>
                  <h3 className="etapa-titulo">{titulo}</h3>
                  <p className="etapa-txt">{texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="gigante" ref={gigante} aria-hidden="true">
        <p className="gigante-linea contorno">Ortodoncia · Sonrisas · Tunja · Ortodoncia · Sonrisas · Tunja ·</p>
        <p className="gigante-linea solida">Brackets · Alineadores · Retenedores · Brackets · Alineadores · Retenedores ·</p>
      </section>

      {/* ---------- Franja con parallax ---------- */}
      <section className="franja-foto parallax" data-parallax="0.3" aria-labelledby="t-franja">
        <img src={`${IMG}franja.webp`} alt="" width="1800" height="900" loading="lazy" />
        <div className="franja-contenido aparecer">
          <p className="eyebrow">Diagnóstico claro</p>
          <h2 id="t-franja" className="franja-titulo">Cada tratamiento empieza con una valoración completa y un plan por escrito.</h2>
          <a className="btn claro btn-grande" href="#/paciente?servicio=valoracion">Agendar valoración <Icono d={I.flecha} /></a>
        </div>
      </section>

      {/* ---------- La doctora ---------- */}
      <section id="doctora" className="seccion doctora doctora-panel" aria-labelledby="t-doctora">
        <Aurora />
        <div className="doctora-foto aparecer tres-d">
          <div className="doc-suave">
            <span className="doc-halo" aria-hidden="true" />
            <div className="doc-gota">
              <img src={`${IMG}sala.webp`} alt="Sala de atención del consultorio con sillón odontológico" width="1000" height="700" loading="lazy" />
            </div>
            <div className="doc-ficha" aria-hidden="true">
              <span className="doc-ficha-ico"><Icono d={I.escudo} size={20} /></span>
              <span className="doc-ficha-txt">
                <strong>Especialista en ortodoncia</strong>
                <span className="doc-ficha-tags"><span>Brackets</span><span>Alineadores</span><span>Tunja</span></span>
              </span>
            </div>
          </div>
        </div>
        <div className="doctora-texto aparecer">
          <p className="eyebrow">La doctora</p>
          <h2 id="t-doctora" className="seccion-titulo">{PROFESIONAL}</h2>
          <p className="doc-rol">Ortodoncista · <em>Tunja, Boyacá</em></p>
          {cupo && (
            <p className="doc-cupo"><span className="isla-punto" aria-hidden="true" />Próxima valoración disponible: <strong>{cupo.fecha === hoy ? 'hoy' : fechaLarga(cupo.fecha).toLowerCase()}, {hora12(cupo.hora)}</strong></p>
          )}
          <p className="seccion-sub">
            Acompaña a cada paciente desde la valoración inicial hasta el último control, con un plan claro y citas puntuales.
          </p>
          <ul className="checks">
            <li><Icono d={I.check} size={18} />Brackets y alineadores</li>
            <li><Icono d={I.check} size={18} />Niños, jóvenes y adultos</li>
            <li><Icono d={I.check} size={18} />Plan de tratamiento por escrito</li>
            <li><Icono d={I.check} size={18} />Controles puntuales, sin filas</li>
          </ul>
          <div className="doc-acciones">
            <a className="btn primario btn-grande magnetico" href="#/paciente?servicio=valoracion">Agendar valoración <Icono d={I.flecha} /></a>
            <a className="btn contorno btn-grande" href="#/?ir=servicios" onClick={(e) => irASeccion(e, 'servicios')}>Ver servicios</a>
          </div>
        </div>
      </section>

      {/* ---------- Conoce el consultorio (galería que se arrastra) ---------- */}
      <section className="galeria-seccion" aria-labelledby="t-galeria">
        <div className="galeria-cab aparecer tres-d">
          <div>
            <p className="eyebrow">Conoce el consultorio</p>
            <h2 id="t-galeria" className="seccion-titulo">Un espacio <em>cómodo</em> para tu tratamiento</h2>
          </div>
          <p className="galeria-ayuda"><Icono d="M8 7l-5 5 5 5M16 7l5 5-5 5M3 12h18" size={18} />Arrastra para recorrerlo</p>
        </div>
        <div className="galeria" ref={galeria} tabIndex={0} aria-label="Fotos del consultorio, desplázate a los lados">
          {GALERIA.map(([foto, alt, pie, alto]) => (
            <figure key={foto} className={`galeria-item ${alto}`}>
              <img src={`${IMG}${foto}`} alt={alt} loading="lazy" draggable="false" />
              <figcaption>{pie}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- Preguntas frecuentes ---------- */}
      <section id="preguntas" className="seccion preguntas" aria-labelledby="t-faq">
        <div className="seccion-cab aparecer tres-d">
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2 id="t-faq" className="seccion-titulo">Lo que suelen <em>preguntarnos</em></h2>
        </div>
        <Preguntas />
      </section>

      {/* ---------- Contacto ---------- */}
      <section id="contacto" className="seccion contacto" aria-labelledby="t-contacto">
        <div className="contacto-texto aparecer">
          <p className="eyebrow">Visítanos</p>
          <h2 id="t-contacto" className="seccion-titulo">{CLINICA} · <em>Ortodoncia</em></h2>
          <ul className="datos-contacto">
            <li><Icono d={I.pin} /><span><strong>Dirección</strong>{DIRECCION}</span></li>
            <li><Icono d={I.reloj} /><span><strong>Horario</strong>Según la agenda de la doctora (hora de Colombia, GMT-5)</span></li>
            <li><Icono d={I.calendario} /><span><strong>Citas</strong>En línea, con cupos actualizados</span></li>
          </ul>
          <a className="enlace" href={MAPA_GRANDE} target="_blank" rel="noreferrer">Ver mapa más grande <Icono d={I.externo} size={16} /></a>
        </div>
        <div className="mapa aparecer">
          <iframe title="Mapa de Tunja, Boyacá" src={MAPA} loading="lazy" referrerPolicy="no-referrer" />
        </div>
      </section>

      {/* ---------- Llamado final ---------- */}
      <section className="seccion">
        <div className="cta aparecer tres-d tilt" data-tilt="4">
          <Aurora />
          <svg className="cta-diente-grande" viewBox="0 0 200 240" aria-hidden="true"><path d={FORMA_DIENTE} /></svg>
          <div>
            <h2 className="cta-titulo">¿Quieres empezar tu <em>tratamiento</em>?</h2>
            <p>Reserva tu valoración y recibe un plan claro desde la primera cita.</p>
          </div>
          <a className="btn claro btn-grande magnetico" href="#/paciente?servicio=valoracion">Agendar valoración <Icono d={I.flecha} /></a>
        </div>
      </section>

      <a
        className={`isla${verIsla ? ' visible' : ''}`} href="#/paciente?servicio=valoracion"
        aria-hidden={!verIsla} tabIndex={verIsla ? 0 : -1}
      >
        <span className="isla-punto" aria-hidden="true" />
        <span className="isla-corto">Agendar cita</span>
        <span className="isla-largo">
          {cupo ? `· Próximo cupo: ${cupo.fecha === hoy ? 'hoy' : fechaLarga(cupo.fecha).toLowerCase()}, ${hora12(cupo.hora)}` : '· Valoración en línea'}
        </span>
        <span className="isla-flecha" aria-hidden="true"><Icono d={I.flecha} size={16} /></span>
      </a>
    </main>
  );
}
