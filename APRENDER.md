# Plan de aprendizaje con el proyecto de citas

El formulario de este proyecto es la **fuente de datos** del pipeline:

```
Formulario (React) --POST JSON--> n8n (Webhook) --> limpieza --> PostgreSQL (Neon) --> SQL / Python
```

| Bloque | Lo que haces en este proyecto |
|---|---|
| 1. Formulario + webhook | Apuntar `VITE_WEBHOOK_URL` a un Webhook de n8n y ver llegar una cita |
| 2. Limpieza en n8n | Validar y normalizar nombre, teléfono y correo |
| 3. PostgreSQL (Neon) | Tablas `servicios` y `citas`, INSERT sin duplicados |
| 4. SQL | 10 consultas sobre tus propias citas |
| 5. Vercel | Desplegar la app y resolver CORS |
| 6. Python | Resumen de citas por día leyendo Postgres |
| 7. Conceptos | Kafka, Spark y DynamoDB, ubicados en este pipeline |

## Horario de referencia y checklist

Los horarios son una guía: si arrancas más tarde, conserva el orden de los bloques y recorre las horas.
Regla del día: si algo se atasca más de 15 minutos, pega el error en el chat y lo resolvemos.

| Bloque | Horario | Entregable que queda en esta carpeta |
|---|---|---|
| 1. Formulario + webhook | 8:00 a 9:30 | El JSON de una cita de prueba visible en n8n (anota los campos en `notas/`) |
| 2. Limpieza en n8n | 9:30 a 11:30 | `n8n/AGENDAR_CITA.json` (workflow exportado) |
| 3. PostgreSQL (Neon) | 11:30 a 13:00 | `sql/01_crear_tablas.sql` |
| 4. SQL | 14:00 a 15:30 | `sql/02_consultas.sql` con las 10 consultas comentadas |
| 5. Vercel | 15:30 a 16:30 | La app publicada y un envío real que llega a Neon |
| 6. Python | 16:30 a 17:30 | `python/resumen_citas.py` |
| 7. Conceptos | 17:30 a 18:00 | `notas/conceptos.md` con 3 frases: para qué sirve cada herramienta y cuándo la usarías |

**Antes de empezar (una sola vez):**
- [ ] Cuentas gratis en n8n Cloud, Vercel, GitHub y Neon.

**Avance:**
- [x] Formulario React funcionando (ya está en esta carpeta)
- [ ] Bloque 1: formulario + webhook
- [ ] Bloque 2: limpieza en n8n
- [ ] Bloque 3: PostgreSQL (Neon)
- [ ] Bloque 4: SQL
- [ ] Bloque 5: Vercel
- [ ] Bloque 6: Python
- [ ] Bloque 7: Conceptos

**Carpetas de trabajo (junto al proyecto):**

| Carpeta | Para qué |
|---|---|
| `n8n/` | Workflows exportados en `.json` |
| `sql/` | Scripts de tablas y consultas |
| `python/` | Scripts de análisis |
| `notas/` | Lo que aprendiste en cada bloque, 3 líneas por bloque |

Nombres en n8n: carpeta `CITAS_ODONTOLOGICAS`, workflow `AGENDAR_CITA`. Usa el mismo path de webhook en n8n y en `VITE_WEBHOOK_URL`.

---

## 1. Formulario + webhook

**Qué es un POST:** una petición HTTP que *envía* datos al servidor (un GET solo pide). Aquí, el navegador envía una cita a n8n.

**Qué es un JSON:** texto con pares `clave: valor`. Es lo que viaja en el POST. La app envía algo así:

```json
{ "nombre": "Ana Pérez", "telefono": "3001234567", "email": "ana@correo.com",
  "servicio": "ortodoncia", "fecha": "2026-11-03", "hora": "09:00",
  "duracion_min": 45, "profesional": "Dra. Camila Restrepo",
  "semana_inicio": "2026-11-02", "website": "", "enviado_en": "..." }
```

**Test URL vs Production URL (n8n):**
- **Test URL** (`/webhook-test/...`): solo funciona mientras pulsas *Listen for test event* y recibe **una** petición. Sirve para ver los datos mientras construyes.
- **Production URL** (`/webhook/...`): funciona siempre, pero **solo con el workflow activado**. Es la que va en producción.

**Práctica**
1. En n8n: workflow nuevo → nodo **Webhook** → *HTTP Method*: `POST` → *Path*: `citas` → pulsa **Listen for test event** y copia la *Test URL*.
2. En el proyecto crea `.env` con `VITE_WEBHOOK_URL=<la Test URL>` y reinicia `npm run dev` (Vite lee el `.env` solo al arrancar).
3. Agenda una cita en `localhost:5173/#/paciente`. En n8n debe aparecer el JSON dentro de `body`.
4. Prueba también sin la app: `curl -X POST "<Test URL>" -H "Content-Type: application/json" -d '{"nombre":"Prueba"}'`.
5. Si el navegador bloquea la petición, verás un error **CORS** en la consola (F12). En el nodo Webhook → *Options* → *Allowed Origins (CORS)* pon `http://localhost:5173`.

**Para comprobar que lo entendiste:** ¿por qué la Test URL deja de funcionar tras una petición? ¿Qué cambia al activar el workflow?

---

## 2. Limpieza en n8n (la "T" de ETL)

El Webhook entrega `headers`, `params`, `query` y `body`; tus datos están en `$json.body`.

1. **Descartar bots:** nodo **IF**, condición `{{ $json.body.website }}` *is not empty* → rama que termina sin guardar nada.
2. **Normalizar** con un nodo **Edit Fields (Set)**:
   - correo: `{{ $json.body.email.trim().toLowerCase() }}`
   - teléfono (solo dígitos): `{{ $json.body.telefono.replace(/\D/g, '') }}`
   - nombre: `{{ $json.body.nombre.trim() }}`
3. **Validar:** nodo **IF** que exija correo con `@`, teléfono de 10 dígitos que empiece por 3, y fecha/hora presentes. Lo inválido va a una rama de error que responde `400`.

---

## 3. PostgreSQL en Neon

```sql
create table servicios (
  id           text primary key,
  nombre       text not null,
  duracion_min int  not null
);
insert into servicios values
  ('valoracion','Valoración inicial',30), ('limpieza','Limpieza dental',30),
  ('blanqueamiento','Blanqueamiento',60), ('ortodoncia','Control de ortodoncia',45);

create table citas (
  id            bigserial primary key,
  nombre        text not null,
  telefono      text not null,
  email         text not null,
  notas         text,
  servicio_id   text not null references servicios(id),
  profesional   text not null,
  fecha         date not null,
  hora          time not null,
  duracion_min  int  not null,
  semana_inicio date not null,
  creada_en     timestamptz not null default now(),
  unique (profesional, fecha, hora)          -- evita dos citas a la misma hora
);
```

**INSERT sin duplicados** (en n8n: nodo Postgres → *Execute Query*):

```sql
insert into citas (nombre, telefono, email, notas, servicio_id, profesional, fecha, hora, duracion_min, semana_inicio)
values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
on conflict (profesional, fecha, hora) do nothing
returning id;
```

Si no devuelve fila, esa hora ya estaba tomada: responde **HTTP 409** con `{"error":"slot_taken"}` y la app mostrará «Esa hora acaba de ser tomada».

**Conexión:** en Neon copia el *connection string* (lleva `sslmode=require`) y guárdalo como **credencial de n8n**. Nunca lo pongas en el código ni lo subas a Git.

**Reto opcional (sin probar):** el `unique` solo evita la *misma hora de inicio*; una cita de 45 min que se traslape con otra no la detecta. Investiga las *exclusion constraints* con `btree_gist` y `tsrange`.

---

## 4. SQL: 10 consultas con tus citas

Inserta al menos 15 citas variadas (desde la app o a mano) y responde:

```sql
-- 1. Las últimas 10 citas
select * from citas order by creada_en desc limit 10;
-- 2. Citas de un día
select nombre, hora from citas where fecha = '2026-11-03' order by hora;
-- 3. Cuántas citas por servicio
select servicio_id, count(*) from citas group by servicio_id;
-- 4. Citas por día
select fecha, count(*) from citas group by fecha order by fecha;
-- 5. JOIN: paciente con el nombre del servicio
select c.nombre, s.nombre as servicio, c.fecha, c.hora
from citas c join servicios s on s.id = c.servicio_id;
-- 6. Minutos agendados por semana
select semana_inicio, sum(duracion_min) as minutos from citas group by semana_inicio order by 1;
-- 7. Servicio más pedido
select servicio_id, count(*) n from citas group by servicio_id order by n desc limit 1;
-- 8. Días con más de 3 citas (HAVING filtra grupos; WHERE filtra filas)
select fecha, count(*) from citas group by fecha having count(*) > 3;
-- 9. Pacientes que repiten
select email, count(*) from citas group by email having count(*) > 1;
-- 10. LEFT JOIN: servicios que nadie ha pedido
select s.nombre from servicios s left join citas c on c.servicio_id = s.id where c.id is null;
```

Conceptos típicos de entrevista: `WHERE` vs `HAVING`, `INNER` vs `LEFT JOIN`, `GROUP BY`, claves primarias y foráneas, índices.

---

## 5. Vercel

1. Sube el proyecto a GitHub (sin `.env` ni `node_modules`; ya están en `.gitignore`).
2. En Vercel: *Add New → Project* → importa el repo (detecta Vite).
3. *Settings → Environment Variables*: `VITE_WEBHOOK_URL` con la **Production URL** de n8n. Redespliega: las variables `VITE_` se incrustan al compilar, así que cambiarlas exige un nuevo despliegue.
4. **CORS:** en el nodo Webhook → *Allowed Origins* pon el dominio de Vercel (por ejemplo `https://citas-tuusuario.vercel.app`).
5. Todo lo `VITE_` queda **visible en el navegador**: nunca pongas ahí contraseñas ni claves.

---

## 6. Python: resumen de citas por día

```python
# pip install psycopg2-binary
import os
import psycopg2

with psycopg2.connect(os.environ["DATABASE_URL"]) as conn, conn.cursor() as cur:
    cur.execute("select fecha, count(*) from citas group by fecha order by fecha")
    for fecha, n in cur.fetchall():
        print(f"{fecha}: {n} cita(s)")
```

Define `DATABASE_URL` como variable de entorno (el connection string de Neon). Si te animas: lee con `pandas.read_sql` y calcula citas por servicio.

---

## 7. Conceptos sin instalar

- **Kafka:** un registro de eventos duradero entre quien produce datos y quien los consume. Aquí iría entre el webhook y varios consumidores (guardar, avisar, analizar) si hubiera miles de citas por segundo. Con este volumen no hace falta.
- **Spark:** procesamiento distribuido para datos que no caben en una sola máquina. Aquí reemplazaría al script de Python solo si hubiera millones de filas.
- **DynamoDB:** base NoSQL clave-valor con latencia estable a gran escala. Aquí sería una opción para consultar la disponibilidad por clave (profesional + fecha) con muchísimo tráfico; Postgres alcanza de sobra.

En este proyecto basta **n8n + Postgres + Python**. Estas tres herramientas resuelven problemas de *escala* que aquí no existen.
