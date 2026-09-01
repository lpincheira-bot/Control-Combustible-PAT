"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"entrar" | "crear">("entrar");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError("Correo o contraseña incorrectos.");
        return;
      }
      router.replace("/");
      router.refresh();
      return;
    }

    // Crear cuenta (queda como conductor por defecto)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre_completo: nombre, role: "conductor" } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="tabular text-accent text-xs tracking-wider">
            REGISTRO DE FLOTA
          </p>
          <h1 className="text-2xl font-semibold mt-1">
            Control de Combustible
          </h1>
        </div>

        <div className="bg-surface border border-line rounded-sm">
          {/* Perforación estilo ticket */}
          <div className="flex justify-between px-4 pt-3 text-ink-muted text-xs tabular">
            <span>{mode === "entrar" ? "INGRESO" : "NUEVA CUENTA"}</span>
            <span>{new Date().toLocaleDateString("es-CL")}</span>
          </div>

          <form onSubmit={handleSubmit} className="p-5 pt-3 space-y-4">
            {mode === "crear" && (
              <Field label="Nombre completo">
                <input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  className="input"
                />
              </Field>
            )}

            <Field label="Correo">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="conductor@empresa.cl"
                className="input"
              />
            </Field>

            <Field label="Contraseña">
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </Field>

            {error && (
              <p className="text-danger text-sm border border-danger/40 bg-danger/10 rounded-sm px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-accent-ink font-semibold py-3 rounded-sm disabled:opacity-60 active:scale-[0.99] transition"
            >
              {loading
                ? "Un momento..."
                : mode === "entrar"
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
            </button>
          </form>
        </div>

        <button
          onClick={() => {
            setError(null);
            setMode(mode === "entrar" ? "crear" : "entrar");
          }}
          className="w-full text-center text-sm text-ink-muted mt-4"
        >
          {mode === "entrar"
            ? "¿Eres nuevo? Crea tu cuenta de conductor"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: 2px;
          padding: 0.65rem 0.75rem;
          color: var(--ink);
        }
        .input:focus {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
