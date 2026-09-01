export type Role = "conductor" | "admin";

export interface Profile {
  id: string;
  nombre_completo: string;
  role: Role;
  activo: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string;
  patente: string;
  vehiculo: string;
  activo: boolean;
  tipo_combustible: "diesel" | "bencina";
  created_at: string;
}

export interface FuelLog {
  id: string;
  driver_id: string;
  vehicle_id: string;
  fecha: string; // YYYY-MM-DD
  hora_carga: string; // HH:MM:SS
  km: number | null;
  conteo_inicial: number;
  litros: number;
  conteo_final: number;
  observaciones: string | null;
  created_at: string;
}

export interface FuelLogRow {
  id: string;
  fecha: string;
  hora_carga: string;
  km: number | null;
  patente: string;
  vehiculo: string;
  conteo_inicial: number;
  litros: number;
  mes: string;
  conteo_final: number;
  conductor: string;
  observaciones: string | null;
  created_at: string;
}
