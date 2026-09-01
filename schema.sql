-- ============================================================================
-- Control de Combustible — esquema de base de datos
-- Ejecutar completo en: Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================================

-- Extensión necesaria para generar UUIDs
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PERFILES (uno por cada usuario de auth.users)
--    role: 'conductor' o 'admin'
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text not null,
  role text not null default 'conductor' check (role in ('conductor', 'admin')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Datos de cada usuario: conductor o administrador.';

-- Crea automáticamente un perfil "conductor" cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre_completo, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'conductor')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. VEHÍCULOS
-- ----------------------------------------------------------------------------
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  patente text not null unique,
  vehiculo text not null, -- marca / modelo, ej: "Kia Rio", "Toyota Hilux"
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.vehicles is 'Flota de vehículos que cargan combustible.';

-- ----------------------------------------------------------------------------
-- 3. CARGAS DE COMBUSTIBLE (una fila = una carga, igual que la planilla en papel)
-- ----------------------------------------------------------------------------
create table if not exists public.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles (id) on delete restrict,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  fecha date not null default current_date,
  hora_carga time not null default current_time,
  km numeric(10, 1),
  conteo_inicial numeric(12, 2) not null,
  litros numeric(8, 2) not null check (litros > 0),
  conteo_final numeric(12, 2) generated always as (conteo_inicial + litros) stored,
  observaciones text,
  created_at timestamptz not null default now()
);

comment on table public.fuel_logs is 'Registro de cada carga de combustible, equivalente a una fila de la planilla en papel.';

create index if not exists fuel_logs_fecha_idx on public.fuel_logs (fecha desc);
create index if not exists fuel_logs_vehicle_idx on public.fuel_logs (vehicle_id);
create index if not exists fuel_logs_driver_idx on public.fuel_logs (driver_id);

-- Vista con el "MES" ya calculado y los nombres listos para mostrar/exportar,
-- en el mismo orden de columnas que la planilla original en papel.
create or replace view public.fuel_logs_view as
select
  fl.id,
  fl.fecha,
  fl.hora_carga,
  fl.km,
  v.patente,
  v.vehiculo,
  fl.conteo_inicial,
  fl.litros,
  to_char(fl.fecha, 'MM') as mes,
  fl.conteo_final,
  p.nombre_completo as conductor,
  fl.observaciones,
  fl.created_at
from public.fuel_logs fl
join public.vehicles v on v.id = fl.vehicle_id
join public.profiles p on p.id = fl.driver_id;

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
--    Conductores: solo ven y crean sus propias cargas.
--    Admin: ve y administra todo.
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.fuel_logs enable row level security;

-- Función auxiliar: ¿el usuario actual es admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: cada quien ve su propio perfil; admin ve todos
create policy "profiles: ver propio o admin ve todos"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles: admin actualiza cualquiera"
  on public.profiles for update
  using (public.is_admin());

-- vehicles: cualquier usuario autenticado puede ver la lista (para el formulario);
-- solo admin puede crear/editar
create policy "vehicles: cualquier autenticado ve"
  on public.vehicles for select
  using (auth.role() = 'authenticated');

create policy "vehicles: admin administra"
  on public.vehicles for all
  using (public.is_admin())
  with check (public.is_admin());

-- fuel_logs: conductor crea y ve las suyas; admin ve y administra todas
create policy "fuel_logs: conductor ve las propias, admin ve todas"
  on public.fuel_logs for select
  using (driver_id = auth.uid() or public.is_admin());

create policy "fuel_logs: conductor crea las propias"
  on public.fuel_logs for insert
  with check (driver_id = auth.uid());

create policy "fuel_logs: admin edita/elimina"
  on public.fuel_logs for update
  using (public.is_admin());

create policy "fuel_logs: admin elimina"
  on public.fuel_logs for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. DATOS DE EJEMPLO (opcional — bórralo si no lo quieres)
-- ----------------------------------------------------------------------------
-- insert into public.vehicles (patente, vehiculo) values
--   ('JYGK-17', 'Ramírez'),
--   ('HTJ1833', 'Ford'),
--   ('SQ.0014', 'Suzuki');

-- ----------------------------------------------------------------------------
-- 6. CÓMO CREAR EL PRIMER ADMINISTRADOR
--    1. Regístrate normalmente desde la app (queda como 'conductor').
--    2. Ve a Supabase > Table Editor > profiles y cambia su "role" a 'admin'.
--    O ejecuta (reemplaza el correo):
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'admin@tuempresa.cl');
-- ----------------------------------------------------------------------------
