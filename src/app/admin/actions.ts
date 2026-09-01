"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function eliminarCarga(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("fuel_logs").delete().eq("id", id);

  if (error) {
    return { error: "No se pudo eliminar la carga." };
  }

  revalidatePath("/admin");
  return { error: null };
}