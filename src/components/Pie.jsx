import { CLINICA, DIRECCION, PROFESIONAL } from '../config.js';
import { irASeccion, Logo } from './Cabecera.jsx';

export default function Pie() {
  return (
    <footer className="pie">
      <div className="pie-grid">
        <div className="pie-marca">
          <a className="marca" href="#/"><Logo /><span className="marca-texto"><span className="marca-nombre">{CLINICA}</span><span className="marca-lema">Ortodoncia Tunja</span></span></a>
          <p>Ortodoncia con la {PROFESIONAL}. Agenda tu cita en línea, cuando quieras.</p>
        </div>
        <div>
          <h2 className="pie-titulo">Pacientes</h2>
          <ul>
            <li><a href="#/paciente">Agendar una cita</a></li>
            <li><a href="#/?ir=servicios" onClick={(e) => irASeccion(e, 'servicios')}>Servicios</a></li>
            <li><a href="#/?ir=como-funciona" onClick={(e) => irASeccion(e, 'como-funciona')}>Cómo funciona</a></li>
          </ul>
        </div>
        <div>
          <h2 className="pie-titulo">Consultorio</h2>
          <ul>
            <li>{DIRECCION}</li>
            <li>Hora de Colombia (GMT-5)</li>
            <li><a href="#/asistente">Acceso de la asistente</a></li>
          </ul>
        </div>
      </div>
      <p className="pie-legal">© {new Date().getFullYear()} {CLINICA}. Todos los derechos reservados.</p>
    </footer>
  );
}
