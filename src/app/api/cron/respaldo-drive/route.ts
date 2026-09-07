import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { Readable } from "stream";
import type { FuelLogRow } from "@/lib/types";

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

function getServiceAccountCredentials() {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!base64) {
    throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 en las variables de entorno.");
  }
  const json = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(json);
}

async function sobrescribirArchivoEnDrive(buffer: Buffer) {
  const credentials = getServiceAccountCredentials();
  const fileId = process.env.GOOGLE_DRIVE_FILE_ID;
  if (!fileId) {
    throw new Error("Falta GOOGLE_DRIVE_FILE_ID en las variables de entorno.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  // Las cuentas de servicio no tienen cuota de almacenamiento propia, así
  // que no pueden CREAR archivos nuevos. En cambio, sobrescribimos el
  // contenido de un archivo que ya existe (creado por una persona real y
  // compartido con la cuenta de servicio). Drive guarda el historial de
  // versiones anteriores automáticamente.
  await drive.files.update({
    fileId,
    media: {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: bufferToStream(buffer),
    },
  });
}

// La librería de Google espera un stream, no un Buffer directo.
function bufferToStream(buffer: Buffer) {
  return Readable.from(buffer);
}

export async function GET(request: NextRequest) {
  // Protección: solo Vercel Cron (o alguien con el secreto) puede llamar esto.
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: logs, error } = await supabase
      .from("fuel_logs_view")
      .select("*")
      .order("fecha", { ascending: true })
      .order("hora_carga", { ascending: true });

    if (error) {
      throw new Error(`Error al leer los registros: ${error.message}`);
    }

    const filas = (logs as FuelLogRow[]) ?? [];

    const sheetData: (string | number)[][] = [[...COLUMNS], ...filas.map(toRow)];
    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    sheet["!cols"] = COLUMNS.map(() => ({ wch: 14 }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Consumo combustible");

    const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const hoy = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `consumo-combustible-${hoy}.xlsx`;

    await sobrescribirArchivoEnDrive(buffer);

    return NextResponse.json({
      ok: true,
      archivo: nombreArchivo,
      registros: filas.length,
    });
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "Error desconocido.";
    console.error("Error en respaldo a Drive:", mensaje);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
