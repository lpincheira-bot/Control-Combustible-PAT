import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/AdminNav";
import ContadoresForm from "@/components/ContadoresForm";
import AjustesForm, { type AjusteContador } from "@/components/AjustesForm";

export default async function ContadoresPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/carga");

  const { data: config } = await supabase
    .from("combustible_config")
    .select("*")
    .order("tipo");

  const { data: ajustes, error: ajustesError } = await supabase
    .from("fuel_adjustments")
    .select("id, tipo_combustible, fecha, conteo_final, motivo, created_at")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (ajustesError) {
    throw new Error(
      `No se pudieron cargar los ajustes: ${ajustesError.message}`
    );
  }

  return (
    <main className="paper min-h-dvh">
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <p className="text-sm text-paper-ink-muted mb-4">
          Define el valor del contador desde el que debe partir cada tipo de
          combustible cuando no hay cargas previas registradas. Una vez que
          exista al menos una carga de ese tipo, el sistema sigue encadenando
          automaticamente desde el ultimo conteo final.
        </p>
        <ContadoresForm config={config ?? []} />
        <AjustesForm ajustes={(ajustes as AjusteContador[]) ?? []} />
      </div>
    </main>
  );
}