import { useEffect, useState } from 'react';
import Cabecera from './components/Cabecera.jsx';
import Pie from './components/Pie.jsx';
import { useOndas } from './hooks/movimiento.js';
import AccesoAsistente from './pages/AccesoAsistente.jsx';
import Inicio from './pages/Inicio.jsx';
import Paciente from './pages/Paciente.jsx';

const RUTAS = {
  '#/paciente': { etq: 'Agenda en línea', sub: 'Agenda tu cita en menos de un minuto', Pagina: Paciente },
  '#/asistente': { etq: 'Uso interno', sub: 'Panel de la asistente', Pagina: AccesoAsistente },
};
const INICIO = { Pagina: Inicio };

// El hash puede llevar parámetros: #/paciente?servicio=ortodoncia, #/?ir=servicios
const leerRuta = () => RUTAS[window.location.hash.split('?')[0]] || INICIO;

export default function App() {
  const [ruta, setRuta] = useState(leerRuta);
  useOndas();

  useEffect(() => {
    const alCambiar = () => {
      setRuta(leerRuta());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  const { etq, sub, Pagina } = ruta;
  return (
    <div className="app">
      <Cabecera />
      {sub && (
        <div className="banda">
          <p className="banda-etq">{etq}</p>
          <p className="banda-sub">{sub}</p>
        </div>
      )}
      <Pagina />
      <Pie />
    </div>
  );
}
