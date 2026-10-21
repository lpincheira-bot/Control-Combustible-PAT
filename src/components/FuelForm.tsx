"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Vehicle } from "@/lib/types";

const GENERADOR_OPTION = "__generador__";
const GENERADOR_PATENTE = "GENERADOR";
const GENERADOR_DESCRIPCION = "Concepto generador";

function normalizarPatente(valor: string) {
  return valor.trim().toUpperCase();
}

function parseDecimal(valor: string) {
  const normalizado = valor.trim().replace(/\s+/g, "").replace(",", ".");
  return /^\d+(?:\.\d+)?$/.test(normalizado) ? Number(normalizado) : NaN;
}

function nowTimeValue() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}:00`;
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
  tipo,
}: {
  vehicles: Vehicle[];
  driverId: string;
  tipo: "diesel" | "bencina";
}) {
  const permiteGenerador = tipo === "diesel";
  const tieneGeneradorReal = vehicles.some(
    (vehicle) => normalizarPatente(vehicle.patente) === GENERADOR_PATENTE
  );
  const mostrarGeneradorVirtual = permiteGenerador && !tieneGeneradorReal;
  const router = useRouter();
  const supabase = createClient();

  const [esExterno, setEsExterno] = useState(false);
  const [vehicleId, setVehicleId] = useState(
    vehicles[0]?.id ?? (mostrarGeneradorVirtual ? GENERADOR_OPTION : "")
  );
  const [patenteExterna, setPatenteExterna] = useState("");
  const [vehiculoExterno, setVehiculoExterno] = useState("");
  const [km, setKm] = useState("");
  const [conteoInicial, setConteoInicial] = useState<number | null>(null);
  const [conteoLoading, setConteoLoading] = useState(false);
  const [litros, setLitros] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<null | {
    patente: string;
    litros: string;
    conteoFinal: string;
  }>(null);

  useEffect(() => {
    let cancelado = false;
    setConteoLoading(true);
    supabase
      .rpc("get_ultimo_conteo", { p_tipo: tipo })
      .then(({ data, error }) => {
        if (cancelado) return;
        setConteoLoading(false);
        if (error) {
          setConteoInicial(0);
          return;
        }
        setConteoInicial(data ?? 0);
      });
    return () => {
      cancelado = true;
    };
  }, [tipo, supabase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const esGeneradorSeleccionado =
      !esExterno && permiteGenerador && vehicleId === GENERADOR_OPTION;

    if (!esExterno && !vehicleId) {
      setError("Selecciona un vehículo.");
      return;
    }
    if (esExterno && !patenteExterna.trim()) {
      setError("Ingresa la patente del vehículo externo.");
      return;
    }
    if (!km.trim()) {
      setError("Ingresa el kilometraje.");
      return;
    }
    if (conteoInicial === null || conteoLoading) {
      setError("Espera un momento, se está calculando el conteo inicial.");
      return;
    }

    // En diésel, el campo "litros" del formulario en realidad contiene el
    // conteo final leído del surtidor (contador acumulativo, no reinicia).
    // Los litros dispensados se calculan por diferencia. En bencina, el
    // valor se sigue ingresando directamente como litros.
    let litrosCalculados: number;
    let nuevoConteo: number;
    const valorNumerico = parseDecimal(litros);

    if (!Number.isFinite(valorNumerico)) {
      setError("Ingresa un valor válido. Puedes usar 10.5 o 10,5.");
      return;
    }

    if (tipo === "diesel") {
      const conteoFinal = valorNumerico;
      if (conteoFinal <= conteoInicial) {
        setError(
          "El conteo final debe ser mayor que el conteo inicial."
        );
        return;
      }
      litrosCalculados = conteoFinal - conteoInicial;
      nuevoConteo = conteoFinal;
    } else {
      if (valorNumerico <= 0) {
        setError("Los litros deben ser mayores que cero.");
        return;
      }
      litrosCalculados = valorNumerico;
      nuevoConteo = conteoInicial + litrosCalculados;
    }

    setLoading(true);
    const { error } = await supabase.from("fuel_logs").insert({
      driver_id: driverId,
      vehicle_id: esExterno || esGeneradorSeleccionado ? null : vehicleId,
      patente_externa: esExterno
        ? patenteExterna.trim()
        : esGeneradorSeleccionado
          ? GENERADOR_PATENTE
          : null,
      vehiculo_externo: esExterno
        ? vehiculoExterno.trim() || null
        : esGeneradorSeleccionado
          ? GENERADOR_DESCRIPCION
          : null,
      fecha: todayValue(),
      hora_carga: nowTimeValue(),
      km: km ? Number(km) : null,
      conteo_inicial: conteoInicial,
      litros: litrosCalculados,
      observaciones: observaciones || null,
      tipo_combustible: tipo,
    });
    setLoading(false);

    if (error) {
      setError("No se pudo guardar la carga. Intenta de nuevo.");
      return;
    }

    const vehicle = esGeneradorSeleccionado
      ? null
      : vehicles.find((v) => v.id === vehicleId);
    const patenteTicket = esExterno
      ? patenteExterna.trim()
      : esGeneradorSeleccionado
        ? GENERADOR_PATENTE
        : vehicle?.patente ?? "";
    setTicket({
      patente: patenteTicket,
      litros: litrosCalculados.toFixed(2),
      conteoFinal: nuevoConteo.toFixed(2),
    });

    setConteoInicial(nuevoConteo);
    setKm("");
    setLitros("");
    setObservaciones("");
    setPatenteExterna("");
    setVehiculoExterno("");
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
      <div className="flex items-center justify-between">
        <span className="block text-xs text-ink-muted">Vehículo</span>
        <button
          type="button"
          onClick={() => setEsExterno((v) => !v)}
          className="text-xs text-accent"
        >
          {esExterno ? "Elegir de la lista" : "Es un vehículo externo"}
        </button>
      </div>

      {esExterno ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Patente">
            <input
              required
              value={patenteExterna}
              onChange={(e) => setPatenteExterna(e.target.value)}
              placeholder="AA-BB-11"
              className="input"
            />
          </Field>
          <Field label="Descripción (opcional)">
            <input
              value={vehiculoExterno}
              onChange={(e) => setVehiculoExterno(e.target.value)}
              placeholder="Camioneta blanca"
              className="input"
            />
          </Field>
        </div>
      ) : (
        <Field label="">
          <select
            required
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="input"
          >
            {vehicles.length === 0 && !mostrarGeneradorVirtual && (
              <option value="">Sin vehículos</option>
            )}
            {mostrarGeneradorVirtual && (
              <option value={GENERADOR_OPTION}>
                {GENERADOR_PATENTE} — {GENERADOR_DESCRIPCION}
              </option>
            )}
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.patente} — {v.vehiculo}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Kilometraje">
        <input
          required
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
          <div
            className="input tabular"
            style={{ opacity: 0.7, cursor: "not-allowed" }}
          >
            {conteoLoading
              ? "Calculando..."
              : conteoInicial !== null
                ? conteoInicial.toFixed(2)
                : "-"}
          </div>
        </Field>
        <Field label={tipo === "diesel" ? "Conteo final" : "Litros"}>
          <input
            required
            type="text"
            inputMode="decimal"
            value={litros}
            onChange={(e) => setLitros(e.target.value)}
            placeholder={
              tipo === "diesel"
                ? conteoInicial !== null
                  ? (conteoInicial + 1).toFixed(2)
                  : "745790.00"
                : "36,5"
            }
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
        disabled={loading || conteoLoading || (!esExterno && !vehicleId)}
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
      {label && (
        <span className="block text-xs text-ink-muted mb-1.5">{label}</span>
      )}
      {children}
    </label>
  );
}