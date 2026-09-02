"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eliminarCargaPropia } from "@/app/carga/actions";
import type { FuelLogRow } from "@/lib/types";

export default function RecentLogs({ logs }: { logs: FuelLogRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  function handleEliminar(id: string) {
    if (!confirm("¿Eliminar esta carga? Esta acción no se puede deshacer.")) {
      return;
    }
    setEliminandoId(id);
    startTransition(async () => {
      await eliminarCargaPropia(id);
      setEliminandoId(null);
      router.refresh();
    });
  }

  if (logs.length === 0) return null;

  return (
    <ul className="space-y-2">
      {logs.map((log) => (
        <li
          key={log.id}
          className="flex items-center justify-between bg-surface border border-line rounded-sm px-4 py-3"
        >
          <div>
            <p className="text-sm">{log.patente}</p>
            <p className="text-xs text-ink-muted">
              {new Date(log.fecha + "T00:00:00").toLocaleDateString("es-CL")}{" "}
              &middot; {log.hora_carga?.slice(0, 5)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="tabular text-sm">{log.litros} L</p>
            <button
              onClick={() => handleEliminar(log.id)}
              disabled={isPending && eliminandoId === log.id}
              style={{ color: "#dc2626" }}
              className="text-xs"
            >
              {isPending && eliminandoId === log.id ? "..." : "Eliminar"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}