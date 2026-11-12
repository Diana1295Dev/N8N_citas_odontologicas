import { CORREO_CONSULTORIO } from '../config.js';

// En pantallas angostas el correo se parte antes de la @, no en cualquier letra
const [usuario, dominio] = CORREO_CONSULTORIO.split('@');
const Correo = () => <b className="correo-chip">{usuario}<wbr />@{dominio}</b>;

const Icono = ({ d }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const I = {
  correo: 'M4 6h16v12H4zM4 7l8 6 8-6',
  telegram: 'M21 4.5 3 11.6l6 2.1M21 4.5l-3 15-8.9-5.8M21 4.5 9.1 13.7M9.1 13.7 9 19l3-3.3',
  alerta: 'M12 4 2.8 19.5h18.4zM12 10v4.5M12 17h.01',
  campana: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
};

// Explica por dónde llega la confirmación. `enviado` = la cita ya se guardó (pantalla final).
export default function ComoLlega({ enviado = false, telegramListo = false }) {
  return (
    <section className="como-llega" aria-labelledby="t-como-llega">
      <header className="como-llega-cab">
        <span className="como-llega-cab-ico"><Icono d={I.campana} /></span>
        <div>
          <h3 id="t-como-llega">{enviado ? 'Así te llega tu confirmación' : '¿Cómo te llega la confirmación?'}</h3>
          <p>{enviado ? 'Te avisamos por dos canales.' : <>Apenas toques <b>Confirmar cita</b>, te avisamos por dos canales.</>}</p>
        </div>
      </header>
      <ul className="como-llega-lista">
        <li>
          <span className="como-llega-ico correo"><Icono d={I.correo} /></span>
          <span>
            <strong>Correo electrónico</strong>
            {enviado ? 'Ya te enviamos' : 'Te enviamos'} un correo desde <Correo /> con todos los datos de tu cita.
          </span>
        </li>
        <li>
          <span className="como-llega-ico telegram"><Icono d={I.telegram} /></span>
          <span>
            <strong>Telegram</strong>
            {telegramListo
              ? 'Ya te llegó al chat del bot. Por ahí también te recordamos tu cita 3 días antes.'
              : <>Se abre automáticamente: toca <b>INICIAR</b> y listo. Por ahí también te recordamos tu cita 3 días antes.</>}
          </span>
        </li>
      </ul>
      <p className="como-llega-nota">
        <span className="como-llega-ico atencion"><Icono d={I.alerta} /></span>
        <span>
          <strong>¿No ves el correo?</strong>
          Espera un par de minutos y revisa las carpetas de <b>Spam</b> o <b>Promociones</b>; busca <Correo />.
          Si está ahí, márcalo como «No es spam» para recibir los próximos en tu bandeja principal.
        </span>
      </p>
    </section>
  );
}
