import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/AdminNav";
import type { Vehicle } from "@/lib/types";
import { addVehicle, toggleVehicleActivo } from "./actions";

export default async function VehiculosPage() {
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

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .order("patente");

  const rows = (vehicles as Vehicle[]) ?? [];

  return (
    <main className="paper min-h-dvh">
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <h2 className="text-sm font-medium mb-3">Agregar vehículo</h2>
        <form
          action={addVehicle}
          className="flex flex-wrap items-end gap-3 mb-8 bg-paper-surface border border-paper-line rounded-sm p-4"
        >
          <label className="block">
            <span className="block text-xs text-paper-ink-muted mb-1">
              Patente
            </span>
            <input
              name="patente"
              required
              placeholder="HTJ1833"
              className="paper-field tabular"
            />
          </label>
          <label className="block flex-1 min-w-[10rem]">
            <span className="block text-xs text-paper-ink-muted mb-1">
              Vehículo (marca / modelo)
            </span>
            <input
              name="vehiculo"
              required
              placeholder="Toyota Hilux"
              className="paper-field w-full"
            />
          </label>
          <button
            type="submit"
            className="bg-paper-ink text-paper-bg font-medium px-4 py-2 rounded-sm"
          >
            Agregar
          </button>
        </form>

        <div className="border border-paper-line rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-paper-surface text-left text-paper-ink-muted">
                <th className="px-3 py-2 font-medium">Patente</th>
                <th className="px-3 py-2 font-medium">Vehículo</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className="border-b border-paper-line last:border-0">
                  <td className="px-3 py-2 tabular">{v.patente}</td>
                  <td className="px-3 py-2">{v.vehiculo}</td>
                  <td className="px-3 py-2">
                    {v.activo ? (
                      <span className="text-success">Activo</span>
                    ) : (
                      <span className="text-paper-ink-muted">Inactivo</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form
                      action={toggleVehicleActivo.bind(null, v.id, v.activo)}
                    >
                      <button className="text-paper-accent text-xs">
                        {v.activo ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-paper-ink-muted">
                    Aún no hay vehículos. Agrega el primero arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .paper-field {
          background: var(--paper-bg);
          border: 1px solid var(--paper-line);
          border-radius: 2px;
          padding: 0.5rem 0.65rem;
          color: var(--paper-ink);
        }
        .paper-field:focus {
          outline: 2px solid var(--paper-accent);
          outline-offset: 1px;
        }
      `}</style>
    </main>
  );
}
