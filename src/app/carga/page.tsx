import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function CargaSelectorPage() {
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

        <p className="text-sm text-ink-muted mb-4">
          Elige el tipo de combustible que vas a cargar.
        </p>

        <div className="space-y-3">
          <Link
            href="/carga/diesel"
            className="block bg-surface border border-line rounded-sm p-5 text-center"
          >
            <span className="block text-lg font-semibold">Diésel</span>
          </Link>
          <Link
            href="/carga/bencina"
            className="block bg-surface border border-line rounded-sm p-5 text-center"
          >
            <span className="block text-lg font-semibold">Bencina</span>
          </Link>
        </div>
      </div>
    </main>
  );
}