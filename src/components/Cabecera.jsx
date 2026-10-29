import { useEffect, useRef, useState } from 'react';
import { CLINICA } from '../config.js';

export const Logo = () => (
  <span className="marca-logo" aria-hidden="true">
    <svg viewBox="0 0 32 32" width="22" height="22"><path d="M9 12c0-3 2-4.500 4.500-4.500 1.200 0 1.800.5 2.500.5s1.300-.5 2.500-.5C21 7.500 23 9 23 12c0 3-1 4-1.500 7-.3 2-.7 5-2 5s-1.300-3-1.800-4.500c-.3-.9-.6-1-.7-1s-.4.100-.7 1C15.800 21 15.500 24 14.200 24s-1.700-3-2-5C11.700 16 9 15 9 12z" fill="currentColor" /></svg>
  </span>
);

const ENLACES = [
  ['servicios', 'Servicios'],
  ['como-funciona', 'Cómo funciona'],
  ['doctora', 'La doctora'],
  ['contacto', 'Contacto'],
];

// En el inicio desplaza hasta la sección; desde otra página vuelve al inicio con ?ir=
export function irASeccion(evento, id) {
  const destino = document.getElementById(id);
  if (!destino) return;
  evento.preventDefault();
  destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Cabecera() {
  const [con, setCon] = useState(false);
  const barra = useRef(null);

  useEffect(() => {
    const alDesplazar = () => {
      setCon(window.scrollY > 8);
      // Cuánto se ha leído de la página (barra fina bajo la cabecera)
      const total = document.documentElement.scrollHeight - window.innerHeight;
      barra.current?.style.setProperty('--leido', total > 0 ? (window.scrollY / total).toFixed(3) : '0');
    };
    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  return (
    <header ref={barra} className={`cabecera${con ? ' con-sombra' : ''}`}>
      <span className="progreso-lectura" aria-hidden="true" />
      <div className="cabecera-fila">
        <a className="marca" href="#/" aria-label={`${CLINICA}, ir al inicio`}>
          <Logo />
          <span className="marca-texto"><span className="marca-nombre">{CLINICA}</span><span className="marca-lema">Ortodoncia Tunja</span></span>
        </a>
        <nav className="nav" aria-label="Secciones">
          {ENLACES.map(([id, texto]) => (
            <a key={id} href={`#/?ir=${id}`} onClick={(e) => irASeccion(e, id)}>{texto}</a>
          ))}
        </nav>
        <a className="btn primario btn-nav" href="#/paciente">Agendar cita</a>
      </div>
    </header>
  );
}
