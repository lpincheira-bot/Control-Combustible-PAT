"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function actualizarConteoBase(tipo: string, valor: number) {
  const supabase = await createClient();

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