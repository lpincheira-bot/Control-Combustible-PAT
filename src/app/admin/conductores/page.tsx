import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/AdminNav";
import type { Profile } from "@/lib/types";
import { setRole, toggleActivo } from "./actions";

export default async function ConductoresPage() {
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

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("nombre_completo");

  const rows = (profiles as Profile[]) ?? [];

  return (
    <main className="paper min-h-dvh">
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <p className="text-sm text-paper-ink-muted mb-4">
          Los conductores crean su propia cuenta desde la pantalla de
          ingreso. Aquí puedes ascenderlos a administrador o desactivarlos.
        </p>
        <div className="border border-paper-line rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-paper-surface text-left text-paper-ink-muted">
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Rol</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-paper-line last:border-0">
                  <td className="px-3 py-2">{p.nombre_completo}</td>
                  <td className="px-3 py-2 capitalize">{p.role}</td>
                  <td className="px-3 py-2">
                    {p.activo ? (
                      <span className="text-success">Activo</span>
                    ) : (
                      <span className="text-paper-ink-muted">Inactivo</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right space-x-3">
                    <form action={setRole.bind(null, p.id, p.role)} className="inline">
                      <button className="text-paper-accent text-xs">
                        {p.role === "admin" ? "Quitar admin" : "Hacer admin"}
                      </button>
                    </form>
                    <form
                      action={toggleActivo.bind(null, p.id, p.activo)}
                      className="inline"
                    >
                      <button className="text-paper-accent text-xs">
                        {p.activo ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-paper-ink-muted">
                    Aún no hay conductores registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
