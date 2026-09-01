"use client";

import { useState, useTransition } from "react";
import { actualizarConteoBase } from "@/app/admin/contadores/actions";

type ConfigRow = { tipo: string; conteo_base: number };

export default function ContadoresForm({ config }: { config: ConfigRow[] }) {
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(config.map((c) => [c.tipo, String(c.conteo_base)]))
  );
  const [isPending, startTransition] = useTransition();
  const [guardadoTipo, setGuardadoTipo] = useState<string | null>(null);

  function guardar(tipo: string) {
    const valor = Number(valores[tipo]);
    if (Number.isNaN(valor)) return;
    startTransition(async () => {
      await actualizarConteoBase(tipo, valor);
      setGuardadoTipo(tipo);
      setTimeout(() => setGuardadoTipo(null), 2000);
    });
  }

  return (
    <div className="space-y-4 max-w-sm">
      {config.map((c) => (
        <div key={c.tipo} className="border border-paper-line rounded-sm p-4">
          <p className="text-sm font-medium capitalize mb-2">{c.tipo}</p>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={valores[c.tipo] ?? ""}
              onChange={(e) =>
                setValores((v) => ({ ...v, [c.tipo]: e.target.value }))
              }
              className="paper-input tabular flex-1"
            />
            <button
              onClick={() => guardar(c.tipo)}
              disabled={isPending}
              className="bg-paper-ink text-paper-bg font-medium px-4 py-2 rounded-sm text-sm"
            >
              {guardadoTipo === c.tipo ? "Guardado" : "Guardar"}
            </button>
          </div>
        </div>
      ))}
      <style jsx global>{`
        .paper-input {
          background: var(--paper-surface);
          border: 1px solid var(--paper-line);
          border-radius: 2px;
          padding: 0.45rem 0.6rem;
          color: var(--paper-ink);
          font-size: 0.875rem;
        }
        .paper-input:focus {
          outline: 2px solid var(--paper-accent);
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}