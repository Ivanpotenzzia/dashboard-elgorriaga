-- Schema para Reservas de Piscina
-- Archivo: supabase_piscina_schema.sql
-- Propósito: Almacenar reservas de piscina importadas desde MULTISELECCION.xlsx

-- Enable UUID extension (should already exist)
create extension if not exists "uuid-ossp";

-- Table: reservas_piscina
create table public.reservas_piscina (
  id_reserva_piscina uuid not null default uuid_generate_v4(),
  fecha_reserva date not null, -- Extraído de celda B6 del Excel
  hora_reserva time without time zone not null, -- Hora de la reserva (franja de 30 min)
  cliente text not null, -- Nombre del cliente
  habitacion text, -- Número de habitación (puede ser null para externos)
  cantidad integer not null default 1, -- Número de reservas/personas
  tecnica text not null, -- RECORRIDO TERMAL ALOJADOS 60´, RECORRIDO TERMAL NO ALOJADOS 60´, IMS PISCINA TERMAL 25´
  duracion_minutos integer not null default 60, -- 60 o 30 según técnica
  fecha_carga timestamp with time zone not null default now(), -- Cuándo se subió el archivo
  activo boolean not null default true, -- Para borrado lógico
  
  constraint reservas_piscina_pkey primary key (id_reserva_piscina),
  constraint check_cantidad_min check (cantidad >= 1),
  constraint check_duracion check (duracion_minutos in (30, 60))
);

-- Indexes for Dashboard Performance
create index idx_reservas_piscina_fecha_hora on public.reservas_piscina (fecha_reserva, hora_reserva) where activo = true;
create index idx_reservas_piscina_fecha on public.reservas_piscina (fecha_reserva) where activo = true;
create index idx_reservas_piscina_fecha_carga on public.reservas_piscina (fecha_carga);

-- Table: audit_log_piscina (Para tracking de cargas)
create table public.audit_log_piscina (
  id_log uuid not null default uuid_generate_v4(),
  fecha_reserva date not null, -- Fecha de las reservas cargadas
  fecha_carga timestamp with time zone not null default now(),
  num_registros integer not null,
  usuario text,
  detalles jsonb,
  
  constraint audit_log_piscina_pkey primary key (id_log)
);

-- RLS Policies
alter table public.reservas_piscina enable row level security;
alter table public.audit_log_piscina enable row level security;

create policy "Enable all access for authenticated users" 
on public.reservas_piscina for all 
to authenticated, anon
using (true) 
with check (true);

create policy "Enable insert for audit" 
on public.audit_log_piscina for insert 
to authenticated, anon 
with check (true);

create policy "Enable read for audit" 
on public.audit_log_piscina for select 
to authenticated, anon 
using (true);

-- COMENTARIOS:
-- 1. La tabla almacena reservas importadas desde MULTISELECCION.xlsx
-- 2. El campo 'tecnica' determina la duración:
--    - "IMS PISCINA TERMAL 25´" → 30 minutos (IMSERSO)
--    - Otros → 60 minutos
-- 3. El archivo se puede subir varias veces al día, por lo que:
--    - Antes de insertar nuevos datos, se eliminan los existentes de esa fecha
--    - Se registra cada carga en audit_log_piscina
-- 4. El campo 'fecha_carga' permite saber cuándo fue la última actualización
