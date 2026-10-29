const PASOS = [
  ['Servicio', 'M8 4c-2.5 0-4 1.6-4 4.2 0 2.6 1.3 4 1.8 6.6.4 2.2.8 5.2 2.2 5.2 1.5 0 1.4-3.2 2-4.6.3-.7.6-.9 2-.9s1.7.2 2 .9c.6 1.4.5 4.6 2 4.6 1.4 0 1.8-3 2.2-5.2.5-2.6 1.8-4 1.8-6.6C20 5.6 18.5 4 16 4c-1.6 0-2.4.8-4 .8S9.6 4 8 4z'],
  ['Fecha y hora', 'M7 3v4M17 3v4M3.5 10h17M5.5 5h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM12 13.5V16l1.8 1'],
  ['Tus datos', 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4.5 20.5c.8-3.6 3.7-6 7.5-6s6.7 2.4 7.5 6'],
  ['Confirmar', 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM8.5 12.2l2.4 2.4 4.6-4.8'],
];

const Icono = ({ d }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const CHECK = 'M5 12.5l4.5 4.5L19 7.5';

export default function Stepper({ paso, maxPaso, onIr }) {
  const avance = ((paso - 1) / (PASOS.length - 1)) * 100;
  return (
    <nav aria-label="Progreso de la cita" className="stepper-caja">
      <ol className="stepper" style={{ '--avance': avance / 100 }}>
        {PASOS.map(([nombre, icono], i) => {
          const n = i + 1;
          const estado = n === paso ? 'actual' : n < paso ? 'hecho' : 'pendiente';
          const navegable = n < paso && n <= maxPaso;
          const contenido = (
            <>
              <span className="step-num" aria-hidden="true"><Icono d={n < paso ? CHECK : icono} /></span>
              <span className="step-texto">
                <span className="step-n">Paso {n}</span>
                <span className="step-nombre">{nombre}</span>
              </span>
            </>
          );
          return (
            <li key={nombre} className={`step ${estado}`} aria-current={n === paso ? 'step' : undefined}>
              {navegable ? (
                <button type="button" onClick={() => onIr(n)} aria-label={`Volver al paso ${n}: ${nombre}`}>{contenido}</button>
              ) : (
                <span className="step-fijo">{contenido}</span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="stepper-movil" aria-hidden="true">
        Paso {paso} de {PASOS.length} · <strong>{PASOS[paso - 1][0]}</strong>
      </p>
    </nav>
  );
}
