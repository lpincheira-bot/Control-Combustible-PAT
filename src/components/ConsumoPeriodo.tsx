"use client";

import { useState, useTransition, type FormEvent } from "react";
import { consultarConsumoPeriodo } from "@/app/admin/contadores/actions";

const formatoLitros = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CL");
}

export default function ConsumoPeriodo() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [resultado, setResultado] = useState<{
    diesel: number;
    bencina: number;
    cargas: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function consultar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResultado(null);

    startTransition(async () => {
      const respuesta = await consultarConsumoPeriodo(desde, hasta);
      if (respuesta.error) {
        setError(respuesta.error);
        return;
      }

      setResultado(respuesta.data);
    });
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium mb-2">Consumo por período</h2>
      <p className="text-sm text-paper-ink-muted mb-4">
        Elige las fechas inicial y final para consultar los litros consumidos,
        incluyendo ambos días.
      </p>

      <form
        onSubmit={consultar}
        className="flex flex-wrap items-end gap-3 mb-4 bg-paper-surface border border-paper-line rounded-sm p-4"
      >
        <label className="block">
          <span className="block text-xs text-paper-ink-muted mb-1">
            Desde
          </span>
          <input
            required
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="paper-input tabular"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-paper-ink-muted mb-1">
            Hasta
          </span>
          <input
            required
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="paper-input tabular"
          />
        </label>
        <button
          type="submit"
          disabled={isPending || !desde || !hasta}
          className="bg-paper-ink text-paper-bg font-medium px-4 py-2 rounded-sm disabled:opacity-60"
        >
          {isPending ? "Calculando..." : "Consultar"}
        </button>
      </form>

      {error && (
        <p className="text-danger text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {resultado && (
        <div className="border border-paper-line rounded-sm overflow-hidden">
          <div className="bg-paper-surface px-4 py-3 text-sm text-paper-ink-muted">
            Período: {formatearFecha(desde)} al {formatearFecha(hasta)} ·{" "}
            {resultado.cargas} carga{resultado.cargas === 1 ? "" : "s"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3">
            <div className="border-t border-paper-line px-4 py-4">
              <p className="text-xs text-paper-ink-muted">Diésel</p>
              <p className="text-lg font-semibold tabular">
                {formatoLitros.format(resultado.diesel)} L
              </p>
            </div>
            <div className="border-t border-paper-line px-4 py-4">
              <p className="text-xs text-paper-ink-muted">Bencina</p>
              <p className="text-lg font-semibold tabular">
                {formatoLitros.format(resultado.bencina)} L
              </p>
            </div>
            <div className="border-t border-paper-line px-4 py-4">
              <p className="text-xs text-paper-ink-muted">Total consumido</p>
              <p className="text-lg font-semibold tabular">
                {formatoLitros.format(resultado.total)} L
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .paper-input {
          background: var(--paper-bg);
          border: 1px solid var(--paper-line);
          border-radius: 2px;
          padding: 0.5rem 0.65rem;
          color: var(--paper-ink);
        }
        .paper-input:focus {
          outline: 2px solid var(--paper-accent);
          outline-offset: 1px;
        }
      `}</style>
    </section>
  );
}
