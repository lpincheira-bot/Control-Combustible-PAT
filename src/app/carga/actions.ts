"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function eliminarCargaPropia(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado." };
  }

  const { error } = await supabase
    .from("fuel_logs")
    .delete()
    .eq("id", id)
    .eq("driver_id", user.id);

  if (error) {
    return { error: "No se pudo eliminar la carga." };
  }

  revalidatePath("/carga", "layout");
  return { error: null };
}