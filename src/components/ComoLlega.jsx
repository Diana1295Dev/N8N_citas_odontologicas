// Explica por dónde llega la confirmación. `enviado` = la cita ya se guardó (pantalla final).
export default function ComoLlega({ email, enviado = false, telegramListo = false }) {
  return (
    <section className="como-llega" aria-labelledby="t-como-llega">
      <h3 id="t-como-llega">{enviado ? 'Así te llega tu confirmación' : '¿Cómo te va a llegar la confirmación?'}</h3>
      {!enviado && <p className="como-llega-intro">Apenas toques <b>Confirmar cita</b>, te avisamos por dos lados:</p>}
      <ol>
        <li>
          <span className="como-llega-ico" aria-hidden="true">📧</span>
          <span>
            <b>A tu correo.</b>{' '}
            {enviado ? <>Ya te escribimos a <b>{email}</b> con todos los datos de tu cita.</> : <>Te escribimos a <b>{email}</b> con todos los datos de tu cita.</>}
          </span>
        </li>
        <li>
          <span className="como-llega-ico" aria-hidden="true">📲</span>
          <span>
            <b>A tu Telegram.</b>{' '}
            {telegramListo
              ? 'Ya te llegó al chat del bot. Por ahí también te recordamos tu cita 3 días antes.'
              : <>Se abre solito; solo toca <b>INICIAR</b> y listo. Por ahí también te recordamos tu cita 3 días antes.</>}
          </span>
        </li>
        <li>
          <span className="como-llega-ico" aria-hidden="true">🔎</span>
          <span>
            <b>¿No ves el correo?</b> Dale un par de minutos y revisa tu carpeta de <b>Spam</b> o <b>Promociones</b>.
            Si está ahí, márcalo como «No es spam» y los próximos te llegarán directo.
          </span>
        </li>
      </ol>
    </section>
  );
}
