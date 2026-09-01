"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Vehicle } from "@/lib/types";

function nowTimeValue() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function todayValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function FuelForm({
  vehicles,
  driverId,
}: {
  vehicles: Vehicle[];
  driverId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [fecha, setFecha] = useState(todayValue());
  const [hora, setHora] = useState(nowTimeValue());
  const [km, setKm] = useState("");
  const [conteoInicial, setConteoInicial] = useState("");
  const [litros, setLitros] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<null | {
    patente: string;
    litros: string;
    conteoFinal: string;
  }>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!vehicleId) {
      setError("Selecciona un vehículo.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("fuel_logs").insert({
      driver_id: driverId,
      vehicle_id: vehicleId,
      fecha,
      hora_carga: `${hora}:00`,
      km: km ? Number(km) : null,
      conteo_inicial: Number(conteoInicial),
      litros: Number(litros),
      observaciones: observaciones || null,
    });
    setLoading(false);

    if (error) {
      setError("No se pudo guardar la carga. Intenta de nuevo.");
      return;
    }

    const vehicle = vehicles.find((v) => v.id === vehicleId);
    setTicket({
      patente: vehicle?.patente ?? "",
      litros,
      conteoFinal: (Number(conteoInicial) + Number(litros)).toFixed(2),
    });

    setKm("");
    setConteoInicial("");
    setLitros("");
    setObservaciones("");
    router.refresh();
  }

  if (ticket) {
    return (
      <div className="bg-surface border border-accent/50 rounded-sm p-6 text-center space-y-3">
        <p className="text-accent text-xs tracking-wider">CARGA REGISTRADA</p>
        <p className="text-2xl font-semibold">{ticket.patente}</p>
        <p className="tabular text-ink-muted text-sm">
          {ticket.litros} L &middot; contador final {ticket.conteoFinal}
        </p>
        <button
          onClick={() => setTicket(null)}
          className="mt-2 bg-accent text-accent-ink font-semibold px-5 py-2.5 rounded-sm"
        >
          Registrar otra carga
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-line rounded-sm p-5 space-y-4"
    >
      <Field label="Vehículo">
        <select
          required
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="input"
        >
          {vehicles.length === 0 && <option value="">Sin vehículos</option>}
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.patente} — {v.vehiculo}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha">
          <input
            required
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="input tabular"
          />
        </Field>
        <Field label="Hora de carga">
          <input
            required
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="input tabular"
          />
        </Field>
      </div>

      <Field label="Kilometraje">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={km}
          onChange={(e) => setKm(e.target.value)}
          placeholder="243377"
          className="input tabular"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Conteo inicial">
          <input
            required
            type="number"
            inputMode="decimal"
            step="0.01"
            value={conteoInicial}
            onChange={(e) => setConteoInicial(e.target.value)}
            placeholder="1059614"
            className="input tabular"
          />
        </Field>
        <Field label="Litros">
          <input
            required
            type="number"
            inputMode="decimal"
            step="0.01"
            value={litros}
            onChange={(e) => setLitros(e.target.value)}
            placeholder="36"
            className="input tabular"
          />
        </Field>
      </div>

      <Field label="Observaciones (opcional)">
        <input
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Comentario"
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
        disabled={loading || vehicles.length === 0}
        className="w-full bg-accent text-accent-ink font-semibold py-3 rounded-sm disabled:opacity-60 active:scale-[0.99] transition"
      >
        {loading ? "Guardando..." : "Registrar carga"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: 2px;
          padding: 0.6rem 0.75rem;
          color: var(--ink);
        }
        .input:focus {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
        }
      `}</style>
    </form>
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
