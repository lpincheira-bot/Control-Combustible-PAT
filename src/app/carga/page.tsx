import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FuelForm from "@/components/FuelForm";
import LogoutButton from "@/components/LogoutButton";
import type { Vehicle } from "@/lib/types";

export default async function CargaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("activo", true)
    .order("patente");

  const { data: recentLogs } = await supabase
    .from("fuel_logs_view")
    .select("*")
    .eq("conductor", profile?.nombre_completo ?? "")
    .order("fecha", { ascending: false })
    .order("hora_carga", { ascending: false })
    .limit(5);

  return (
    <main className="min-h-dvh px-5 py-8">
      <div className="max-w-md mx-auto">
        <header className="flex items-start justify-between mb-6">
          <div>
            <p className="text-accent text-xs tracking-wider">
              REGISTRO DE FLOTA
            </p>
            <h1 className="text-xl font-semibold mt-1">
              Hola, {profile?.nombre_completo?.split(" ")[0] ?? "conductor"}
            </h1>
          </div>
          <LogoutButton className="mt-1" />
        </header>

        <FuelForm vehicles={(vehicles as Vehicle[]) ?? []} driverId={user.id} />

        {recentLogs && recentLogs.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xs text-ink-muted tracking-wider mb-3">
              TUS ÚLTIMAS CARGAS
            </h2>
            <ul className="space-y-2">
              {recentLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between bg-surface border border-line rounded-sm px-4 py-3"
                >
                  <div>
                    <p className="text-sm">{log.patente}</p>
                    <p className="text-xs text-ink-muted">
                      {new Date(log.fecha + "T00:00:00").toLocaleDateString(
                        "es-CL"
                      )}{" "}
                      &middot; {log.hora_carga?.slice(0, 5)}
                    </p>
                  </div>
                  <p className="tabular text-sm">{log.litros} L</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-center text-xs text-ink-muted mt-8">
          ¿Eres administrador?{" "}
          <Link href="/admin" className="text-accent">
            Ir al panel
          </Link>
        </p>
      </div>
    </main>
  );
}
