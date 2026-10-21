import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/AdminNav";
import AdminTable from "@/components/AdminTable";
import { getFuelLogRows } from "@/lib/fuelLogs";

export default async function AdminPage() {
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

  const rows = await getFuelLogRows(supabase);
  const vehiculos = Array.from(new Set(rows.map((r) => r.patente))).sort();
  const conductores = Array.from(new Set(rows.map((r) => r.conductor))).sort();

  return (
    <main className="paper min-h-dvh">
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <AdminTable logs={rows} vehiculos={vehiculos} conductores={conductores} />
      </div>
    </main>
  );
}
