-- Base de datos de la app de citas (Neon / PostgreSQL).
-- La app es la fuente de verdad; Google Sheets recibe solo una copia de respaldo.
-- Se puede ejecutar varias veces sin dañar nada (usa "if not exists").

-- Horario habitual de la doctora (lo que la asistente marca en su panel). Una sola fila.
create table if not exists horario (
  id             smallint primary key default 1 check (id = 1),
  dias           smallint[] not null default '{}',        -- 0 = lunes … 5 = sábado
  manana_on      boolean    not null default true,
  manana_ini     smallint   not null default 480,          -- minutos desde medianoche (480 = 8:00)
  manana_fin     smallint   not null default 720,          -- 12:00
  tarde_on       boolean    not null default true,
  tarde_ini      smallint   not null default 840,          -- 14:00
  tarde_fin      smallint   not null default 1020,         -- 17:00
  actualizado_en timestamptz not null default now()
);
-- Horario inicial de ejemplo: martes, jueves y sábado
insert into horario (id, dias) values (1, '{1,3,5}') on conflict (id) do nothing;

-- Días en que la doctora no atiende (semanas completas o festivos sueltos)
create table if not exists no_atiende (
  fecha date primary key
);

-- Citas reservadas por las pacientes
create table if not exists citas (
  id                   text primary key,               -- el mismo ID que viaja a Telegram (ej. C1107JOOI)
  nombre               text not null,
  telefono             text not null,
  email                text not null,
  notas                text not null default '',
  servicio             text not null,
  servicio_nombre      text not null,
  duracion_min         smallint not null,
  profesional          text not null,
  fecha                date not null,
  hora                 time not null,
  estado               text not null default 'Confirmada',  -- Confirmada | Confirmada por paciente | Reprogramada | Cancelada
  telegram_chat        text,
  cambios              smallint not null default 0,         -- la paciente puede cambiar la fecha una sola vez
  recordatorio_enviado timestamptz,
  creada_en            timestamptz not null default now()
);

-- Dos citas activas no pueden empezar a la misma hora con la misma doctora.
-- Las canceladas no cuentan, así su hora vuelve a quedar libre.
create unique index if not exists citas_hora_unica
  on citas (profesional, fecha, hora) where estado <> 'Cancelada';

create index if not exists citas_por_fecha on citas (fecha);
