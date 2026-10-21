-- Ejecutar una vez en Supabase SQL Editor para habilitar el registro de ajustes.

create table if not exists public.fuel_adjustments (
  id uuid primary key default gen_random_uuid(),
  tipo_combustible text not null check (tipo_combustible in ('diesel', 'bencina')),
  fecha date not null,
  conteo_final numeric(12, 2) not null check (conteo_final >= 0),
  motivo text not null check (length(btrim(motivo)) between 1 and 500),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists fuel_adjustments_tipo_fecha_idx
  on public.fuel_adjustments (tipo_combustible, fecha desc, created_at desc);

alter table public.fuel_adjustments enable row level security;

drop policy if exists "fuel_adjustments: admin ve"
  on public.fuel_adjustments;
create policy "fuel_adjustments: admin ve"
  on public.fuel_adjustments for select
  using (public.is_admin());

drop policy if exists "fuel_adjustments: admin registra"
  on public.fuel_adjustments;
create policy "fuel_adjustments: admin registra"
  on public.fuel_adjustments for insert
  with check (public.is_admin() and created_by = auth.uid());

grant select, insert on public.fuel_adjustments to authenticated;

create or replace function public.get_ultimo_conteo(p_tipo text)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select eventos.conteo_final
      from (
        select
          fl.fecha,
          fl.created_at,
          fl.conteo_final,
          0 as prioridad
        from public.fuel_logs fl
        where fl.tipo_combustible = p_tipo

        union all

        select
          fa.fecha,
          fa.created_at,
          fa.conteo_final,
          1 as prioridad
        from public.fuel_adjustments fa
        where fa.tipo_combustible = p_tipo
      ) as eventos
      order by eventos.fecha desc, eventos.created_at desc, eventos.prioridad desc
      limit 1
    ),
    (
      select cc.conteo_base
      from public.combustible_config cc
      where cc.tipo = p_tipo
    ),
    0
  )
$$;

grant execute on function public.get_ultimo_conteo(text) to authenticated;
