import { useMemo, useRef, useState } from 'react';
import { enviarCita } from '../api/enviarCita.js';
import { TZ, PROFESIONAL, servicioPorId } from '../config.js';
import { limpiarCache } from '../hooks/semanas.js';
import { ahoraBogota, lunesDe, rangoSemanas } from '../lib/fechas.js';
import { normalizarTelefono } from '../lib/validar.js';
import CitaCard from '../components/CitaCard.jsx';
import DatosStep from '../components/DatosStep.jsx';
import Exito from '../components/Exito.jsx';
import FechaStep from '../components/FechaStep.jsx';
import ResumenStep from '../components/ResumenStep.jsx';
import ServicioStep from '../components/ServicioStep.jsx';
import Stepper from '../components/Stepper.jsx';

const DATOS_VACIOS = { nombre: '', telefono: '', email: '', notas: '', consentimiento: false };

export default function Paciente() {
  const rango = useMemo(() => rangoSemanas(ahoraBogota()), []);
  const [paso, setPaso] = useState(1);
  const [maxPaso, setMaxPaso] = useState(1);
  // Desde las tarjetas del inicio llega #/paciente?servicio=<id>
  const [servicioId, setServicioId] = useState(
    () => servicioPorId(new URLSearchParams(window.location.hash.split('?')[1]).get('servicio'))?.id || null,
  );
  const [semana, setSemana] = useState(rango.min);
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);
  const [datos, setDatos] = useState(DATOS_VACIOS);
  const [trampa, setTrampa] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [aviso, setAviso] = useState('');
  const [exito, setExito] = useState(null);
  const contenido = useRef(null);

  const servicio = servicioPorId(servicioId);

  const ir = (n) => {
    setPaso(n);
    setMaxPaso((m) => Math.max(m, n));
    setErrorEnvio('');
    contenido.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const elegirServicio = (id) => {
    if (id !== servicioId) {
      setServicioId(id);
      setFecha(null);
      setHora(null);
    }
  };

  const cambiarSemana = (s) => {
    setSemana(s);
    setFecha(null);
    setHora(null);
  };

  const elegirFecha = (f) => {
    if (f !== fecha) setHora(null);
    setFecha(f);
    setAviso('');
  };

  const confirmar = async () => {
    setEnviando(true);
    setErrorEnvio('');
    try {
      if (!trampa) {
        await enviarCita({
          nombre: datos.nombre.trim(),
          telefono: normalizarTelefono(datos.telefono),
          email: datos.email.trim(),
          notas: datos.notas.trim(),
          servicio: servicio.id,
          servicio_nombre: servicio.nombre,
          fecha,
          hora,
          duracion_min: servicio.duracion_min,
          profesional: PROFESIONAL,
          semana_inicio: lunesDe(fecha),
          zona_horaria: TZ,
          website: trampa,
          enviado_en: new Date().toISOString(),
        });
      } // con la trampa llena se finge éxito sin enviar nada
      setExito({ servicio, fecha, hora, email: datos.email.trim() });
      limpiarCache();
    } catch (e) {
      if (e.codigo === 'slot_taken') {
        limpiarCache();
        setHora(null);
        setSemana(lunesDe(fecha));
        setAviso('Esa hora acaba de ser tomada. Elige otra.');
        ir(2);
      } else {
        setErrorEnvio(
          e.codigo === 'red'
            ? 'No pudimos conectarnos. Revisa tu conexión a internet e inténtalo de nuevo.'
            : 'El sistema de citas no respondió y tu cita no quedó registrada. Inténtalo de nuevo en unos minutos.',
        );
      }
    } finally {
      setEnviando(false);
    }
  };

  const nueva = () => {
    setExito(null);
    setPaso(1);
    setMaxPaso(1);
    setServicioId(null);
    setFecha(null);
    setHora(null);
    setSemana(rango.min);
    setDatos(DATOS_VACIOS);
    setTrampa('');
    setAviso('');
  };

  return (
      <main className="contenedor" ref={contenido}>
        {exito ? (
          <section className="panel panel-exito"><Exito cita={exito} onNueva={nueva} /></section>
        ) : (
          <>
            <Stepper paso={paso} maxPaso={maxPaso} onIr={ir} />
            <div className="layout">
              <section className="panel">
                {paso === 1 && <ServicioStep servicioId={servicioId} onElegir={elegirServicio} onSiguiente={() => ir(2)} />}
                {paso === 2 && servicio && (
                  <FechaStep
                    servicio={servicio} semana={semana} fecha={fecha} hora={hora} rango={rango} aviso={aviso}
                    onSemana={cambiarSemana} onFecha={elegirFecha} onHora={(h) => { setHora(h); setAviso(''); }}
                    onAtras={() => ir(1)} onSiguiente={() => ir(3)}
                  />
                )}
                {paso === 3 && (
                  <DatosStep
                    datos={datos} trampa={trampa}
                    onCambio={(k, v) => setDatos((d) => ({ ...d, [k]: v }))} onTrampa={setTrampa}
                    onAtras={() => ir(2)} onSiguiente={() => ir(4)}
                  />
                )}
                {paso === 4 && (
                  <ResumenStep
                    servicio={servicio} fecha={fecha} hora={hora} datos={datos}
                    enviando={enviando} errorEnvio={errorEnvio} onAtras={() => ir(3)} onConfirmar={confirmar}
                  />
                )}
              </section>
              <CitaCard servicio={servicio} fecha={fecha} hora={hora} />
            </div>
          </>
        )}
      </main>
  );
}
