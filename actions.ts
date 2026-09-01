"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export async function setRole(id: string, role: Role) {
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ role: role === "admin" ? "conductor" : "admin" })
    .eq("id", id);
  revalidatePath("/admin/conductores");
}

export async function toggleActivo(id: string, activo: boolean) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ activo: !activo }).eq("id", id);
  revalidatePath("/admin/conductores");
}
