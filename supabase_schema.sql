-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: reservas_externas
create table public.reservas_externas (
  id_reserva uuid not null default uuid_generate_v4(),
  fecha_reserva date not null,
  hora_reserva time without time zone not null, -- Franja de 30 min
  nombre_cliente text not null,
  telefono text not null,
  adultos integer not null default 0,
  ninos integer not null default 0,
  servicio_comida boolean not null default false,
  comensales_comida integer, -- Nullable if service_comida is false
  servicio_cena boolean not null default false,
  comensales_cena integer, -- Nullable if service_cena is false
  importe_pago numeric(10,2) not null default 0.00,
  estado_pago text not null check (estado_pago in ('Pendiente', 'Pagado', 'Bono Regalo', 'Cancelado')),
  detalles_br text,
  activo boolean not null default true,
  usuario_creacion text,
  fecha_creacion timestamp with time zone not null default now(),
  fecha_modificacion timestamp with time zone,
  
  constraint reservas_externas_pkey primary key (id_reserva),
  constraint check_pax_min check (adultos + ninos >= 1),
  constraint check_comida check (case when servicio_comida then comensales_comida >= 1 else true end),
  constraint check_cena check (case when servicio_cena then comensales_cena >= 1 else true end)
);

-- Indexes for Dashboard Performance
create index idx_reservas_fecha_hora on public.reservas_externas (fecha_reserva, hora_reserva) where activo = true;
create index idx_reservas_restaurante_comida on public.reservas_externas (fecha_reserva) where servicio_comida = true and activo = true;
create index idx_reservas_restaurante_cena on public.reservas_externas (fecha_reserva) where servicio_cena = true and activo = true;

-- Table: audit_log (Simplified for MVP)
create table public.audit_log (
  id_log uuid not null default uuid_generate_v4(),
  id_reserva uuid references public.reservas_externas(id_reserva),
  accion text not null, -- CREATE, UPDATE, DELETE
  usuario text,
  fecha_log timestamp with time zone not null default now(),
  detalles jsonb
);

-- RLS Policies (Open for MVP, lock down later)
alter table public.reservas_externas enable row level security;
alter table public.audit_log enable row level security;

create policy "Enable all access for authenticated users" 
on public.reservas_externas for all 
to authenticated, anon -- Using anon for simplicity if no auth yet, but ideally authenticated
using (true) 
with check (true);

create policy "Enable insert for audit" 
on public.audit_log for insert 
to authenticated, anon 
with check (true);
