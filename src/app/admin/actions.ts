"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const GENERADOR_OPTION = "__generador__";
const EXTERNO_OPTION = "__externo__";

type EditarCarga = {
  id: string;
  fecha: string;
  hora: string;
  vehicleId: string;
  patenteExterna: string;
  vehiculoExterno: string;
  km: string;
  conteoInicial: string;
  litros: string;
  observaciones: string;
};

function parseDecimal(valor: string, decimales = 2) {
  const normalizado = valor.trim().replace(/\s+/g, "").replace(",", ".");
  const patron = new RegExp(`^\\d+(?:\\.\\d{1,${decimales}})?$`);
  if (!patron.test(normalizado)) return null;

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

function fechaValida(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor
  );
}

function horaValida(valor: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(valor);
}

async function verificarAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    return { supabase, user: null };
  }

  return { supabase, user };
}

export async function actualizarCarga({
  id,
  fecha,
  hora,
  vehicleId,
  patenteExterna,
  vehiculoExterno,
  km,
  conteoInicial,
  litros,
  observaciones,
}: EditarCarga) {
  const { supabase, user } = await verificarAdmin();
  if (!user) return { error: "Solo un administrador puede editar cargas." };

  if (!id || !fechaValida(fecha) || !horaValida(hora)) {
    return { error: "Revisa la fecha y hora de la carga." };
  }

  const conteoInicialNumero = parseDecimal(conteoInicial);
  const litrosNumero = parseDecimal(litros);
  const kmNumero = km.trim() ? parseDecimal(km, 1) : null;

  if (conteoInicialNumero === null || litrosNumero === null || litrosNumero <= 0) {
    return {
      error: "El conteo inicial debe ser válido y los litros mayores que cero (máximo 2 decimales).",
    };
  }
  if (km.trim() && (kmNumero === null || kmNumero < 0)) {
    return { error: "El kilometraje no es válido." };
  }

  const { data: carga, error: cargaError } = await supabase
    .from("fuel_logs")
    .select("tipo_combustible")
    .eq("id", id)
    .maybeSingle();

  if (cargaError || !carga) {
    return { error: "No se encontró la carga que quieres editar." };
  }

  let vehicleUpdate: {
    vehicle_id: string | null;
    patente_externa: string | null;
    vehiculo_externo: string | null;
  };

  if (vehicleId === GENERADOR_OPTION) {
    if (carga.tipo_combustible !== "diesel") {
      return { error: "GENERADOR solo se puede asignar a cargas de diésel." };
    }
    vehicleUpdate = {
      vehicle_id: null,
      patente_externa: "GENERADOR",
      vehiculo_externo: "Concepto generador",
    };
  } else if (vehicleId === EXTERNO_OPTION) {
    const patente = patenteExterna.trim();
    if (!patente) {
      return { error: "Ingresa la patente del vehículo externo." };
    }
    vehicleUpdate = {
      vehicle_id: null,
      patente_externa: patente,
      vehiculo_externo: vehiculoExterno.trim() || null,
    };
  } else {
    if (!vehicleId) return { error: "Selecciona un vehículo." };

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, tipo_combustible")
      .eq("id", vehicleId)
      .maybeSingle();

    if (vehicleError || !vehicle) {
      return { error: "No se encontró el vehículo seleccionado." };
    }
    if (vehicle.tipo_combustible !== carga.tipo_combustible) {
      return {
        error: "El vehículo debe corresponder al tipo de combustible de la carga.",
      };
    }

    vehicleUpdate = {
      vehicle_id: vehicle.id,
      patente_externa: null,
      vehiculo_externo: null,
    };
  }

  const { data: actualizada, error } = await supabase
    .from("fuel_logs")
    .update({
      ...vehicleUpdate,
      fecha,
      hora_carga: `${hora}:00`,
      km: kmNumero,
      conteo_inicial: conteoInicialNumero,
      litros: litrosNumero,
      observaciones: observaciones.trim() || null,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("No se pudo actualizar la carga:", error.message);
    return { error: "No se pudo guardar la edición." };
  }
  if (!actualizada) {
    return { error: "No se pudo encontrar o actualizar la carga." };
  }

  revalidatePath("/admin");
  revalidatePath("/carga", "layout");
  return { error: null };
}

export async function eliminarCarga(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("fuel_logs").delete().eq("id", id);

  if (error) {
    return { error: "No se pudo eliminar la carga." };
  }

  revalidatePath("/admin");
  return { error: null };
}