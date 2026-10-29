export const TZ = 'America/Bogota';
export const OFFSET_BOGOTA_H = 5; // Bogotá es UTC-5 todo el año (sin horario de verano)

export const PROFESIONAL = 'Dra. Camila Restrepo';
export const CLINICA = 'Patricia Rojas';
export const DIRECCION = 'Tunja, Boyacá'; // poner aquí la dirección exacta del consultorio

export const BLOQUE_MIN = 30; // tamaño de cada bloque de agenda
export const ANTICIPACION_MIN = 60; // no se ofrecen horas con menos de 1 h de anticipación
export const SEMANAS_MAX = 8; // semana actual + 7 hacia adelante

export const SERVICIOS = [
  {
    id: 'valoracion',
    nombre: 'Valoración inicial',
    duracion_min: 30,
    descripcion: 'Revisión completa y plan de tratamiento.',
  },
  {
    id: 'limpieza',
    nombre: 'Limpieza dental',
    duracion_min: 30,
    descripcion: 'Profilaxis y control de placa.',
  },
  {
    id: 'blanqueamiento',
    nombre: 'Blanqueamiento',
    duracion_min: 60,
    descripcion: 'Aclaramiento dental en consultorio.',
  },
  {
    id: 'ortodoncia',
    nombre: 'Control de ortodoncia',
    duracion_min: 45,
    descripcion: 'Ajuste de brackets o alineadores.',
  },
];

export const servicioPorId = (id) => SERVICIOS.find((s) => s.id === id) || null;
