"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginConPin } from "./actions";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "borrar", "0", "ok"];

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function presionar(tecla: string) {
    setError(null);
    if (tecla === "borrar") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (tecla === "ok") {
      enviar();
      return;
    }
        if (pin.length < 4) {
      setPin((p) => p + tecla);
    }
  }

  function enviar() {
    if (pin.length === 0) {
      setError("Ingresa tu PIN.");
      return;
    }
    startTransition(async () => {
      const { error } = await loginConPin(pin);
      if (error) {
        setError(error);
        setPin("");
        return;
      }
      router.replace("/");
      router.refresh();
    });
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
          <div className="flex justify-between px-4 pt-3 text-ink-muted text-xs tabular">
            <span>INGRESO CON PIN</span>
            <span>{new Date().toLocaleDateString("es-CL")}</span>
          </div>

          <div className="p-5 pt-3 space-y-4">
            <div className="flex justify-center gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="inline-block rounded-full border"
                  style={{
                    width: 14,
                    height: 14,
                    borderColor: i < pin.length ? "var(--accent)" : "var(--line)",
                    backgroundColor: i < pin.length ? "var(--accent)" : "transparent",
                  }}
                />
              ))}
            </div>

            {error && (
              <p className="text-danger text-sm border border-danger/40 bg-danger/10 rounded-sm px-3 py-2 text-center">
                {error}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2">
              {TECLAS.map((tecla) => (
                <button
                  key={tecla}
                  type="button"
                  onClick={() => presionar(tecla)}
                  disabled={isPending}
                  className={
                    tecla === "ok"
                      ? "bg-accent text-accent-ink font-semibold text-sm rounded-sm py-4"
                      : "bg-surface-2 border border-line rounded-sm py-4 text-lg text-ink"
                  }
                >
                  {tecla === "borrar" ? "Borrar" : tecla === "ok" ? "Ingresar" : tecla}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}