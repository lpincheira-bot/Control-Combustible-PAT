"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addVehicle(formData: FormData) {
  const patente = String(formData.get("patente") ?? "").trim().toUpperCase();
  const vehiculo = String(formData.get("vehiculo") ?? "").trim();

  if (!patente || !vehiculo) return;

  const supabase = await createClient();
  await supabase.from("vehicles").insert({ patente, vehiculo });
  revalidatePath("/admin/vehiculos");
}

export async function toggleVehicleActivo(id: string, activo: boolean) {
  const supabase = await createClient();
  await supabase.from("vehicles").update({ activo: !activo }).eq("id", id);
  revalidatePath("/admin/vehiculos");
}
