"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FuelLogRow } from "@/lib/types";
import { eliminarCarga } from "@/app/admin/actions";

const COLUMNS = [
  "FECHA",
  "HORA DE CARGA",
  "KM",
  "PATENTE",
  "VEHÍCULO",
  "CONTEO INICIAL",
  "LITROS",
  "MES",
  "CONTEO FINAL",
  "CONDUCTOR",
] as const;

function toRow(log: FuelLogRow) {
  return [
    log.fecha,
    log.hora_carga?.slice(0, 5) ?? "",
    log.km ?? "",
    log.patente,
    log.vehiculo,
    log.conteo_inicial,
    log.litros,
    log.mes,
    log.conteo_final,
    log.conductor,
  ];
}

export default function AdminTable({
  logs,
  vehiculos,
  conductores,
}: {
  logs: FuelLogRow[];
  vehiculos: string[];
  conductores: string[];
}) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [patente, setPatente] = useState("");
  const [conductor, setConductor] = useState("");
  const [exporting, setExporting] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  function handleEliminar(id: string) {
    if (!confirm("¿Eliminar esta carga? Esta acción no se puede deshacer.")) {
      return;
    }
    setEliminandoId(id);
    startTransition(async () => {
      await eliminarCarga(id);
      setEliminandoId(null);
      router.refresh();
    });
  }

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (desde && log.fecha < desde) return false;
      if (hasta && log.fecha > hasta) return false;
      if (patente && log.patente !== patente) return false;
      if (conductor && log.conductor !== conductor) return false;
      return true;
    });
  }, [logs, desde, hasta, patente, conductor]);

  const totalLitros = filtered.reduce((sum, l) => sum + Number(l.litros), 0);

  async function handleExport() {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const sheetData: (string | number)[][] = [
        [...COLUMNS],
        ...filtered.map(toRow),
      ];
      const sheet = XLSX.utils.aoa_to_sheet(sheetData);
      sheet["!cols"] = COLUMNS.map(() => ({ wch: 14 }));
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Consumo combustible");
      const today = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(book, `consumo-combustible-${today}.xlsx`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <FilterField label="Desde">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="paper-input tabular"
          />
        </FilterField>
        <FilterField label="Hasta">
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="paper-input tabular"
          />
        </FilterField>
        <FilterField label="Vehículo">
          <select
            value={patente}
            onChange={(e) => setPatente(e.target.value)}
            className="paper-input"
          >
            <option value="">Todos</option>
            {vehiculos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Conductor">
          <select
            value={conductor}
            onChange={(e) => setConductor(e.target.value)}
            className="paper-input"
          >
            <option value="">Todos</option>
            {conductores.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FilterField>

        <button
          onClick={handleExport}
          disabled={exporting || filtered.length === 0}
          className="ml-auto bg-paper-ink text-paper-bg font-medium px-4 py-2 rounded-sm disabled:opacity-50"
        >
          {exporting ? "Generando..." : "Descargar planilla (.xlsx)"}
        </button>
      </div>

      <p className="text-sm text-paper-ink-muted mb-3">
        {filtered.length} registro{filtered.length === 1 ? "" : "s"} &middot;{" "}
        <span className="tabular">{totalLitros.toFixed(1)}</span> L en total
      </p>

      <div className="overflow-x-auto border border-paper-line rounded-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paper-line bg-paper-surface text-left text-paper-ink-muted">
              {COLUMNS.map((col) => (
                <th key={col} className="px-3 py-2 font-medium whitespace-nowrap">
                  {col}
                </th>
              ))}
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr
                key={log.id}
                className="border-b border-paper-line last:border-0"
              >
                <td className="px-3 py-2 tabular whitespace-nowrap">
                  {log.fecha}
                </td>
                <td className="px-3 py-2 tabular whitespace-nowrap">
                  {log.hora_carga?.slice(0, 5)}
                </td>
                <td className="px-3 py-2 tabular">{log.km ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{log.patente}</td>
                <td className="px-3 py-2 whitespace-nowrap">{log.vehiculo}</td>
                <td className="px-3 py-2 tabular">{log.conteo_inicial}</td>
                <td className="px-3 py-2 tabular">{log.litros}</td>
                <td className="px-3 py-2 tabular">{log.mes}</td>
                <td className="px-3 py-2 tabular">{log.conteo_final}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {log.conductor}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => handleEliminar(log.id)}
                    disabled={isPending && eliminandoId === log.id}
                    style={{ color: "#dc2626" }}
                    className="text-xs"
                  >
                    {isPending && eliminandoId === log.id
                      ? "Eliminando..."
                      : "Eliminar"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  className="px-3 py-8 text-center text-paper-ink-muted"
                >
                  Sin registros para estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-paper-ink-muted mb-1">{label}</span>
      {children}
    </label>
  );
}