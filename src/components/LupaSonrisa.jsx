import { useEffect, useRef } from 'react';
import { sinMovimiento } from '../hooks/movimiento.js';

/**
 * Foto con una lupa que sigue al cursor (o al dedo) y revela otra capa debajo.
 * Hoy la capa revelada es la misma foto en "vista de diagnóstico" (estilo radiografía).
 * Cuando haya fotos reales de antes y después, basta con pasar `revelada` con la foto del después
 * y `estiloDiagnostico={false}`.
 */
export default function LupaSonrisa({ foto, revelada = foto, alt, etiqueta = 'Vista de diagnóstico', estiloDiagnostico = true }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const poner = (x, y) => {
      el.style.setProperty('--lx', `${x}%`);
      el.style.setProperty('--ly', `${y}%`);
    };
    poner(52, 40);
    if (sinMovimiento()) return undefined;

    // Mientras nadie la mueve, la lupa recorre la sonrisa sola
    let raf = 0;
    let manual = false;
    let t0 = performance.now();
    const pasear = (t) => {
      if (!manual) {
        const s = (t - t0) / 1000;
        poner(52 + Math.sin(s * 0.7) * 13, 40 + Math.sin(s * 1.1) * 6);
      }
      raf = requestAnimationFrame(pasear);
    };
    raf = requestAnimationFrame(pasear);

    const mover = (e) => {
      const r = el.getBoundingClientRect();
      manual = true;
      el.classList.add('manual');
      poner(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
    };
    const salir = () => {
      manual = false;
      el.classList.remove('manual');
      t0 = performance.now();
    };
    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerleave', salir);
    el.addEventListener('pointerup', (e) => e.pointerType !== 'mouse' && salir());
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerleave', salir);
    };
  }, []);

  return (
    <div className="lupa" ref={ref}>
      <img className="lupa-base" src={foto} alt={alt} width="1000" height="1200" fetchpriority="high" />
      <div className={`lupa-capa${estiloDiagnostico ? ' diagnostico' : ''}`} aria-hidden="true">
        <img src={revelada} alt="" width="1000" height="1200" />
      </div>
      <span className="lupa-aro" aria-hidden="true"><span className="lupa-etq">{etiqueta}</span></span>
      <span className="lupa-pista" aria-hidden="true">Mueve el cursor sobre la sonrisa</span>
    </div>
  );
}
