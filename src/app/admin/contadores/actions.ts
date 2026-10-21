"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type NuevoAjuste = {
  tipo: string;
  fecha: string;
  conteoFinal: string;
  motivo: string;
};

function parseConteo(valor: string) {
  const normalizado = valor.trim().replace(/\s+/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizado)) return null;

  const conteo = Number(normalizado);
  return Number.isFinite(conteo) && conteo >= 0 ? conteo : null;
}

function fechaEsValida(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor
  );
}

async function verificarAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, error: "No autenticado." };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    return {
      supabase,
      user: null,
      error: "Solo un administrador puede realizar esta acción.",
    };
  }

  return { supabase, user, error: null };
}

export async function actualizarConteoBase(tipo: string, valor: number) {
  const { supabase, error: authError } = await verificarAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("combustible_config")
    .update({ conteo_base: valor })
    .eq("tipo", tipo);

  if (error) {
    return { error: "No se pudo guardar." };
  }

  revalidatePath("/admin/contadores");
  return { error: null };
}

export async function agregarAjuste({
  tipo,
  fecha,
  conteoFinal,
  motivo,
}: NuevoAjuste) {
  const { supabase, user, error: authError } = await verificarAdmin();
  if (authError || !user) return { error: authError ?? "No autorizado." };

  if (tipo !== "diesel" && tipo !== "bencina") {
    return { error: "Selecciona un tipo de combustible válido." };
  }
  if (!fechaEsValida(fecha)) {
    return { error: "Ingresa una fecha válida." };
  }

  const conteoNormalizado = parseConteo(conteoFinal);
  if (conteoNormalizado === null) {
    return {
      error: "Ingresa un conteo igual o mayor que cero, con hasta 2 decimales.",
    };
  }

  const motivoLimpio = motivo.trim();
  if (!motivoLimpio || motivoLimpio.length > 500) {
    return { error: "Ingresa el motivo del ajuste (máximo 500 caracteres)." };
  }

  const { error } = await supabase.from("fuel_adjustments").insert({
    tipo_combustible: tipo,
    fecha,
    conteo_final: conteoNormalizado,
    motivo: motivoLimpio,
    created_by: user.id,
  });

  if (error) {
    console.error("No se pudo registrar el ajuste:", error.message);
    return { error: "No se pudo guardar el ajuste." };
  }

  revalidatePath("/admin/contadores");
  revalidatePath("/carga", "layout");
  return { error: null };
}