"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { agregarAjuste } from "@/app/admin/contadores/actions";

export type AjusteContador = {
  id: string;
  tipo_combustible: "diesel" | "bencina";
  fecha: string;
  conteo_final: number;
  motivo: string;
  created_at: string;
};

function fechaLocalHoy() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(hoy.getDate()).padStart(2, "0")}`;
}

export default function AjustesForm({
  ajustes,
}: {
  ajustes: AjusteContador[];
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"diesel" | "bencina">("diesel");
  const [fecha, setFecha] = useState("");
  const [conteoFinal, setConteoFinal] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [isPending, startTransition] = useTransition();

  function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardado(false);

    startTransition(async () => {
      const resultado = await agregarAjuste({
        tipo,
        fecha: fecha || fechaLocalHoy(),
        conteoFinal,
        motivo,
      });

      if (resultado.error) {
        setError(resultado.error);
        return;
      }

      setConteoFinal("");
      setMotivo("");
      setFecha("");
      setGuardado(true);
      router.refresh();
    });
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium mb-2">Ajustes de contador</h2>
      <p className="text-sm text-paper-ink-muted mb-4">
        Registra el nuevo valor final del contador. Desde la fecha indicada,
        las próximas cargas continuarán a partir de ese valor.
      </p>

      <form
        onSubmit={guardar}
        className="flex flex-wrap items-end gap-3 mb-5 bg-paper-surface border border-paper-line rounded-sm p-4"
      >
        <label className="block">
          <span className="block text-xs text-paper-ink-muted mb-1">
            Combustible
          </span>
          <select
            required
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "diesel" | "bencina")}
            className="paper-field"
          >
            <option value="diesel">Diésel</option>
            <option value="bencina">Bencina</option>
          </select>
        </label>

        <label className="block">
          <span className="block text-xs text-paper-ink-muted mb-1">Fecha</span>
          <input
            required
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="paper-field tabular"
          />
        </label>

        <label className="block">
          <span className="block text-xs text-paper-ink-muted mb-1">
            Nuevo conteo final
          </span>
          <input
            required
            type="text"
            inputMode="decimal"
            value={conteoFinal}
            onChange={(e) => setConteoFinal(e.target.value)}
            placeholder="Ej. 745790,50"
            className="paper-field tabular"
          />
        </label>

        <label className="block flex-1 min-w-[12rem]">
          <span className="block text-xs text-paper-ink-muted mb-1">Motivo</span>
          <input
            required
            maxLength={500}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Describe el motivo del ajuste"
            className="paper-field w-full"
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="bg-paper-ink text-paper-bg font-medium px-4 py-2 rounded-sm disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Agregar ajuste"}
        </button>
      </form>

      {error && (
        <p className="text-danger text-sm mb-4" role="alert">
          {error}
        </p>
      )}
      {guardado && (
        <p className="text-success text-sm mb-4" role="status">
          Ajuste registrado.
        </p>
      )}

      <h3 className="text-sm font-medium mb-3">
        Historial de ajustes ({ajustes.length})
      </h3>
      <div className="border border-paper-line rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paper-line bg-paper-surface text-left text-paper-ink-muted">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Combustible</th>
              <th className="px-3 py-2 font-medium">Conteo final</th>
              <th className="px-3 py-2 font-medium">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {ajustes.map((ajuste) => (
              <tr
                key={ajuste.id}
                className="border-b border-paper-line last:border-0"
              >
                <td className="px-3 py-2 tabular whitespace-nowrap">
                  {new Date(`${ajuste.fecha}T00:00:00`).toLocaleDateString(
                    "es-CL"
                  )}
                </td>
                <td className="px-3 py-2 capitalize">
                  {ajuste.tipo_combustible === "diesel" ? "Diésel" : "Bencina"}
                </td>
                <td className="px-3 py-2 tabular">
                  {Number(ajuste.conteo_final).toFixed(2)}
                </td>
                <td className="px-3 py-2">{ajuste.motivo}</td>
              </tr>
            ))}
            {ajustes.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-paper-ink-muted"
                >
                  Aún no hay ajustes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
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
    </section>
  );
}
