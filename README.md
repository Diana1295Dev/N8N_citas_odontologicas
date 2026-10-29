# Citas odontológicas · asistente de 4 pasos

React 18 + Vite. Solo frontend: la paciente elige servicio, semana, día y hora según la disponibilidad de la ortodoncista.

```bash
npm install
npm run dev      # desarrollo
npm run build    # producción (carpeta dist/)
npm test         # pruebas de slots consecutivos, semanas y anticipación
```

## Pantallas

- **Inicio** (`#/`): dos botones, *Soy paciente* y *Soy asistente de la ortodoncista*.
- **Paciente** (`#/paciente`): servicio → semana, día y hora → datos → confirmar.
- **Asistente** (`#/asistente`): tres pasos sin botón de guardar (todo se guarda solo): 1) tocar los días que atiende, 2) elegir el horario de mañana y de tarde, 3) marcar las semanas en que la doctora **no atiende** (botón «Toda») o un día suelto, como un festivo. Lo que queda aquí es exactamente lo que la paciente puede elegir. Hoy se guarda en el navegador (`src/data/horario.store.js`).

**«Sin cupo» no se marca a mano:** cada cita confirmada ocupa sus bloques (`src/data/reservas.store.js`, solo fecha, hora y duración). Cuando un día ya no tiene hueco para el servicio elegido, la paciente lo ve como «Sin cupo», y en el calendario de la asistente aparece en amarillo cuando no queda ninguna hora libre (si no, muestra «N citas»). Con la API real, el servidor descuenta sus citas y este archivo se reemplaza.

## Fotos

Las fotos de `public/img/` son de [Unsplash](https://unsplash.com/license): uso gratuito, también comercial, sin atribución obligatoria. Son de ejemplo y conviene reemplazarlas por fotos reales del consultorio (mismo nombre de archivo). No hay foto de la doctora: agrégala cuando la tengas, en vez de usar una de banco.

## Tablero de citas confirmadas

Al entrar, la asistente ve dos pestañas: **Citas confirmadas** y **Disponibilidad**. El tablero muestra:
- Contadores: hoy, próximos 7 días, total próximas y la siguiente cita.
- Filtros (hoy, 7 días, todas, pasadas) y un buscador por nombre, celular o correo.
- La lista agrupada por día, con botones para llamar, escribir por WhatsApp o enviar correo.
- «Cancelar» (con confirmación), que libera la hora.
- La descarga de la vista actual en CSV, que abre en Excel.

En modo demo las citas salen de `src/data/reservas.store.js`, solo las de este navegador. Con la API real, ese archivo se reemplaza por la lista que entregue el servidor, por ejemplo desde Postgres vía n8n.

## Ingreso de la asistente

`#/asistente` pide **número de identificación y contraseña** (demo: `1234567890` / `demo1234`; mientras no haya credenciales en `.env`, el formulario llega precargado con ellas). Tras 5 intentos fallidos se bloquea 1 minuto y la sesión dura 8 horas o hasta «Cerrar sesión».

Para poner las credenciales reales: `npm run clave-asistente -- <identificacion> <contraseña>` imprime dos líneas (`VITE_ASISTENTE_USUARIO` y `VITE_ASISTENTE_CLAVE_SHA256`); pégalas en `.env` (o en Vercel) y vuelve a compilar. Solo se guarda la huella SHA-256, no la contraseña.

**Límite:** al ser solo frontend, esto evita que una paciente entre por error, pero no es seguridad real: quien sepa leer el código puede saltárselo. Cuando exista la API, el ingreso debe validarse en el servidor (`src/lib/sesion.js` es el archivo a reemplazar).

## Conectar la API real

**Archivos a reemplazar: `src/data/disponibilidad.mock.js`** (lo que ve la paciente) **y `src/data/horario.store.js`** (lo que guarda la asistente). No hay que tocar nada más: basta con definir la variable de entorno y dejar de usarlo.

1. Copia `.env.example` a `.env` y define `VITE_API_BASE=https://tu-api.com` (sin barra final).
2. `src/api/disponibilidad.js` hará entonces `GET {VITE_API_BASE}/disponibilidad?semana=AAAA-MM-DD&servicio=ortodoncia` (la semana es el lunes) y el aviso «Modo demo» desaparece.
3. La API debe responder:

```json
{
  "semana_inicio": "2026-11-02", "semana_fin": "2026-11-07",
  "profesional": "Dra. Camila Restrepo", "duracion_min": 45,
  "dias": [ { "fecha": "2026-11-02", "slots": [] }, { "fecha": "2026-11-03", "slots": ["08:00", "08:30"] } ]
}
```

Siempre 6 días (lunes a sábado); `slots: []` si no hay cupo. Opcionalmente, un día sin horas puede llevar `"motivo"`: `"no_atiende"` (la ortodoncista no trabaja ese día), `"sin_cupo"` (atiende pero todo está tomado) o `"pasado"`. Sin `motivo`, la app muestra «Sin cupo». Las horas son de Bogotá y el servidor ya debe aplicar la duración del servicio y la anticipación mínima.

## Envío de la cita

`POST` a `VITE_WEBHOOK_URL` con `nombre, telefono, email, notas, servicio, servicio_nombre, fecha, hora, duracion_min, profesional, semana_inicio, zona_horaria, website (campo trampa), enviado_en`. Si la hora ya no está libre, responde HTTP `409` o `{ "error": "slot_taken" }`: la app vuelve al paso de fecha, recarga y avisa. Sin `VITE_WEBHOOK_URL` el envío se simula; abre la página con `?slot_taken=1` para ver ese caso.
