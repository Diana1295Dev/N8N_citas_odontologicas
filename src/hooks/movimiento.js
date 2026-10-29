import { useEffect, useRef } from 'react';

// Efectos de movimiento del sitio. Todos se desactivan con "reducir movimiento" del sistema.
export const sinMovimiento = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

/** Agrega .visible a los .aparecer de la raíz cuando entran en pantalla. */
export function useAparecer() {
  const raiz = useRef(null);
  useEffect(() => {
    const nodos = raiz.current.querySelectorAll('.aparecer');
    if (!('IntersectionObserver' in window)) {
      nodos.forEach((n) => n.classList.add('visible'));
      return undefined;
    }
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    nodos.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);
  return raiz;
}

/**
 * Onda al tocar (como el "ripple" de Material/Flutter) en botones, accesos y chips de toda la app.
 * Se agrega un <span class="onda"> en el punto del clic y se borra al terminar su animación.
 */
export function useOndas() {
  useEffect(() => {
    if (sinMovimiento()) return undefined;
    const tocar = (e) => {
      const el = e.target.closest?.('.btn, .rol, .chip, .pestana, .segmento, .faq-pregunta, .cupo-link, .dia');
      if (!el || el.disabled) return;
      const r = el.getBoundingClientRect();
      const lado = Math.max(r.width, r.height) * 2.2;
      const onda = document.createElement('span');
      onda.className = 'onda';
      onda.style.cssText = `width:${lado}px;height:${lado}px;left:${e.clientX - r.left - lado / 2}px;top:${e.clientY - r.top - lado / 2}px`;
      el.appendChild(onda);
      onda.addEventListener('animationend', () => onda.remove());
    };
    document.addEventListener('pointerdown', tocar);
    return () => document.removeEventListener('pointerdown', tocar);
  }, []);
}

/**
 * Inclinación 3D: cada .tilt dentro de la raíz gira hacia el mouse (--rx, --ry en grados) y mueve su reflejo (--gx, --gy).
 * El ángulo máximo sale de data-tilt (8° por defecto). Solo con mouse; en pantallas táctiles lo reemplaza una animación CSS.
 */
export function useInclinar3D(raiz) {
  useEffect(() => {
    const el = raiz.current;
    if (!el || sinMovimiento() || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return undefined;
    const mover = (e) => {
      const t = e.target.closest?.('.tilt');
      if (!t) return;
      const r = t.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const max = Number(t.dataset.tilt || 8);
      t.classList.add('tilt-activo');
      t.style.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
      t.style.setProperty('--rx', `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
      t.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      t.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    };
    const salir = (e) => {
      const t = e.target.closest?.('.tilt');
      if (!t || t.contains(e.relatedTarget)) return;
      t.classList.remove('tilt-activo');
      t.style.setProperty('--rx', '0deg');
      t.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerout', salir);
    return () => {
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerout', salir);
    };
  }, [raiz]);
}

/**
 * Parallax: cada [data-parallax="0.15"] dentro de la raíz recibe --py (px) según lo lejos que está
 * del centro de la pantalla. El CSS mueve su imagen con ese valor, así la foto se desplaza más lento que la página.
 */
export function useParallax(raiz) {
  useEffect(() => {
    const el = raiz.current;
    if (!el || sinMovimiento()) return undefined;
    const nodos = [...el.querySelectorAll('[data-parallax]')];
    let raf = 0;
    const calcular = () => {
      raf = 0;
      const alto = window.innerHeight;
      for (const n of nodos) {
        const r = n.getBoundingClientRect();
        if (r.bottom < -100 || r.top > alto + 100) continue;
        const distancia = r.top + r.height / 2 - alto / 2;
        n.style.setProperty('--py', `${(-distancia * Number(n.dataset.parallax)).toFixed(1)}px`);
      }
    };
    const pedir = () => { if (!raf) raf = requestAnimationFrame(calcular); };
    calcular();
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    return () => {
      window.removeEventListener('scroll', pedir);
      window.removeEventListener('resize', pedir);
      cancelAnimationFrame(raf);
    };
  }, [raiz]);
}

/**
 * Progreso del desplazamiento por un elemento, en --p (0 a 1).
 * 'paso': 0 cuando asoma por abajo, 1 cuando sale por arriba. 'fijo': para secciones con contenido sticky.
 */
export function useProgreso(ref, tipo = 'paso') {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (sinMovimiento()) {
      el.style.setProperty('--p', '1');
      return undefined;
    }
    let raf = 0;
    const calcular = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const alto = window.innerHeight;
      const p = tipo === 'fijo' ? -r.top / Math.max(1, r.height - alto) : (alto - r.top) / (alto + r.height);
      el.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4));
    };
    const pedir = () => { if (!raf) raf = requestAnimationFrame(calcular); };
    calcular();
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    return () => {
      window.removeEventListener('scroll', pedir);
      window.removeEventListener('resize', pedir);
      cancelAnimationFrame(raf);
    };
  }, [ref, tipo]);
}

/** Para la pista horizontal: guarda en --dist cuántos px debe correrse para mostrar todas las etapas. */
export function useDistancia(contenedor, pista) {
  useEffect(() => {
    const c = contenedor.current;
    const p = pista.current;
    if (!c || !p) return undefined;
    const medir = () => c.style.setProperty('--dist', `${Math.max(0, p.scrollWidth - c.clientWidth)}px`);
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(c);
    obs.observe(p);
    return () => obs.disconnect();
  }, [contenedor, pista]);
}

/** Botones magnéticos: los .magnetico se desplazan un poco hacia el cursor. */
export function useMagnetico(raiz) {
  useEffect(() => {
    const el = raiz.current;
    if (!el || sinMovimiento() || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return undefined;
    const mover = (e) => {
      const t = e.target.closest?.('.magnetico');
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.translate = `${((e.clientX - r.left) / r.width - 0.5) * 12}px ${((e.clientY - r.top) / r.height - 0.5) * 10}px`;
    };
    const salir = (e) => {
      const t = e.target.closest?.('.magnetico');
      if (t && !t.contains(e.relatedTarget)) t.style.translate = '';
    };
    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerout', salir);
    return () => {
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerout', salir);
    };
  }, [raiz]);
}

/** Galería que se arrastra con el mouse (en táctil usa el deslizamiento nativo). Evita el clic si hubo arrastre. */
export function useArrastre(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia?.('(pointer: fine)').matches) return undefined;
    let x0 = 0;
    let inicio = 0;
    let activo = false;
    let movio = false;
    const bajar = (e) => {
      if (e.button !== 0) return;
      activo = true;
      movio = false;
      x0 = e.clientX;
      inicio = el.scrollLeft;
      el.classList.add('arrastrando');
    };
    const mover = (e) => {
      if (!activo) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 4) movio = true;
      el.scrollLeft = inicio - dx;
    };
    const soltar = () => {
      activo = false;
      el.classList.remove('arrastrando');
    };
    const clic = (e) => {
      if (movio) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener('pointerdown', bajar);
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    el.addEventListener('click', clic, true);
    el.addEventListener('dragstart', (e) => e.preventDefault());
    return () => {
      el.removeEventListener('pointerdown', bajar);
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      el.removeEventListener('click', clic, true);
    };
  }, [ref]);
}
