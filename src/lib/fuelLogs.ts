import type { SupabaseClient } from "@supabase/supabase-js";
import type { FuelLogRow } from "@/lib/types";

type SupabaseLike = Pick<SupabaseClient, "from">;

type FuelLogRecord = {
  id: string;
  driver_id: string;
  vehicle_id: string | null;
  fecha: string;
  hora_carga: string;
  km: number | null;
  conteo_inicial: number;
  litros: number;
  conteo_final: number | null;
  observaciones: string | null;
  created_at: string;
  patente_externa?: string | null;
  vehiculo_externo?: string | null;
};

type ProfileRecord = {
  id: string;
  nombre_completo: string;
};

type VehicleRecord = {
  id: string;
  patente: string;
  vehiculo: string;
};

type FuelLogQueryOptions = {
  driverId?: string;
  limit?: number;
  sortDirection?: "asc" | "desc";
};

export async function getFuelLogRows(
  supabase: SupabaseLike,
  {
    driverId,
    limit,
    sortDirection = "desc",
  }: FuelLogQueryOptions = {}
): Promise<FuelLogRow[]> {
  const ascending = sortDirection === "asc";

  let query = supabase
    .from("fuel_logs")
    .select("*")
    .order("fecha", { ascending })
    .order("hora_carga", { ascending });

  if (driverId) {
    query = query.eq("driver_id", driverId);
  }

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`No se pudieron leer los registros: ${error.message}`);
  }

  return hydrateFuelLogRows(supabase, (data as FuelLogRecord[]) ?? []);
}

async function hydrateFuelLogRows(
  supabase: SupabaseLike,
  logs: FuelLogRecord[]
): Promise<FuelLogRow[]> {
  if (logs.length === 0) {
    return [];
  }

  const driverIds = Array.from(new Set(logs.map((log) => log.driver_id)));
  const vehicleIds = Array.from(
    new Set(logs.map((log) => log.vehicle_id).filter(isNonEmptyString))
  );

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, nombre_completo")
    .in("id", driverIds);

  if (profilesError) {
    throw new Error(
      `No se pudieron leer los conductores: ${profilesError.message}`
    );
  }

  let vehicles: VehicleRecord[] = [];

  if (vehicleIds.length > 0) {
    const { data: vehiclesData, error: vehiclesError } = await supabase
      .from("vehicles")
      .select("id, patente, vehiculo")
      .in("id", vehicleIds);

    if (vehiclesError) {
      throw new Error(
        `No se pudieron leer los vehículos: ${vehiclesError.message}`
      );
    }

    vehicles = (vehiclesData as VehicleRecord[]) ?? [];
  }

  const profilesById = new Map(
    ((profiles as ProfileRecord[]) ?? []).map((profile) => [profile.id, profile])
  );
  const vehiclesById = new Map(
    vehicles.map((vehicle) => [vehicle.id, vehicle])
  );

  return logs.map((log) => {
    const vehicle = log.vehicle_id ? vehiclesById.get(log.vehicle_id) : null;
    const patente = vehicle?.patente ?? log.patente_externa?.trim() ?? "";
    const vehiculo = vehicle?.vehiculo ?? log.vehiculo_externo?.trim() ?? "";
    const conteoFinal =
      typeof log.conteo_final === "number"
        ? log.conteo_final
        : Number((log.conteo_inicial + log.litros).toFixed(2));

    return {
      id: log.id,
      fecha: log.fecha,
      hora_carga: log.hora_carga,
      km: log.km,
      patente,
      vehiculo,
      conteo_inicial: log.conteo_inicial,
      litros: log.litros,
      mes: log.fecha.slice(5, 7),
      conteo_final: conteoFinal,
      conductor: profilesById.get(log.driver_id)?.nombre_completo ?? "",
      observaciones: log.observaciones,
      created_at: log.created_at,
    };
  });
}

function isNonEmptyString(value: string | null): value is string {
  return typeof value === "string" && value.length > 0;
}
