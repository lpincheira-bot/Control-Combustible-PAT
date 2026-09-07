/**
 * Script para crear conductores en batch.
 *
 * USO:
 *   1. npm install @supabase/supabase-js
 *   2. Completa SUPABASE_URL y SERVICE_ROLE_KEY abajo (o usa variables de entorno).
 *   3. node crear-conductores.mjs
 *
 * El PIN de cada conductor = los primeros 4 dígitos de su fecha de
 * nacimiento en formato DDMM (día + mes). Ej: 23-10-1966 -> PIN "2310".
 *
 * El correo se genera igual que en el sistema real (src/lib/pin.ts):
 *   pin@conductor.local
 *
 * Si dos conductores comparten día y mes de nacimiento, el PIN chocaría
 * (mismo correo). En ese caso, al segundo (y siguientes) se le arma el
 * PIN con día + últimos 2 dígitos del año en vez de día + mes.
 * Ej: 22-07-1989 -> en vez de "2207" (ya tomado) -> "2289".
 *
 * No hace falta cambiar nada en Supabase: los usuarios se crean con la
 * Service Role Key (Admin API), que no aplica el mínimo de contraseña
 * de 6 caracteres del dashboard — por eso el PIN de 4 dígitos funciona.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Node no lee .env.local automáticamente (eso solo lo hace Next.js al
// correr la app). Lo leemos a mano aquí para sacar las dos variables
// que necesitamos.
function leerEnvLocal(nombreVariable) {
  try {
    const buffer = readFileSync(".env.local");

    // Detectar si el archivo se guardó como UTF-16 (común si se editó con
    // Notepad/WordPad en Windows) en vez de UTF-8, y decodificarlo bien
    // en cualquiera de los dos casos.
    let contenido;
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      contenido = buffer.toString("utf16le");
    } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      contenido = buffer.swap16().toString("utf16le");
    } else {
      contenido = buffer.toString("utf-8");
    }

    // Quita el BOM de UTF-8 si existe.
    contenido = contenido.replace(/^\uFEFF/, "");

    const linea = contenido
      .split(/\r?\n/)
      .find((l) => l.trim().startsWith(`${nombreVariable}=`));
    if (!linea) return null;
    return linea.split("=").slice(1).join("=").trim();
  } catch {
    return null;
  }
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || leerEnvLocal("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || leerEnvLocal("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ No encontré NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.\n" +
      "   Revisa que existan en tu archivo .env.local, en la misma carpeta que este script,\n" +
      "   con el formato: NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Pega aquí las filas del Excel: [nombre, "DD-MM-YYYY"]
const CONDUCTORES = [
  ["Celso Perez", "23-10-1966"],
  ["Javiera Fernández", "28-01-1991"],
  ["David Ortega", "14-01-1974"],
  ["Edmundo Schuster", "22-02-1968"],
  ["Gloria Espinoza", "21-04-1988"],
  ["Eduardo Jesus Espinoza", "22-07-1984"],
  ["Marissa Miranda", "20-10-1979"],
  ["Francisco Puelma", "31-01-1963"],
  ["Jose Manuel Herrera", "09-09-2000"],
  ["Luis Marchant", "17-12-1981"],
  ["Marco Fariña", "23-02-1965"],
  ["Ricardo Barrientos", "24-10-1988"],
  ["Ramiro Vargas", "24-07-1982"],
  ["David Leiva", "22-07-1989"],
  ["Alfredo Ruiz", "22-08-1951"],
  ["Sebastián Castillo", "29-11-1989"],
  ["Karen Sáez", "27-06-1995"],
  ["José Alejandro Gomez", "28-06-1955"],
  ["Josefina Menchacabaso", "27-12-1993"],
  ["Esteban Bagnis", "02-05-1984"],
  ["Paula Araya", "12-03-1968"],
  ["Victor Mancilla", "22-09-1978"],
  ["Luis Pincheira", "01-02-1994"],
  ["Sebastian Pero", "07-06-1994"],
  ["Luis Ruiz", "04-09-1985"],
  ["Diego Tureo", "25-03-1991"],
  ["Tomas Porras", "09-12-1990"],
  ["Daniela Paredes", "11-04-1995"],
  ["Alejandro Olivera", "24-01-1976"],
  ["Johny Sepulveda", "26-10-1989"],
];

function pinToEmail(pin) {
  return `${pin}@conductor.local`;
}

function generarPin(nombre, fechaDDMMYYYY, pinesUsados) {
  const [dd, mm, yyyy] = fechaDDMMYYYY.split("-");
  const pinBase = `${dd}${mm}`;

  if (!pinesUsados.has(pinBase)) {
    pinesUsados.add(pinBase);
    return pinBase;
  }

  // Choque: usar día + últimos 2 dígitos del año
  const pinAlterno = `${dd}${yyyy.slice(-2)}`;
  if (!pinesUsados.has(pinAlterno)) {
    console.warn(
      `⚠️  ${nombre}: PIN ${pinBase} ya estaba en uso, se le asignó ${pinAlterno} (día+año) en su lugar.`
    );
    pinesUsados.add(pinAlterno);
    return pinAlterno;
  }

  // Muy improbable, pero si también choca el alterno, hay que resolverlo a mano.
  throw new Error(
    `${nombre}: no se pudo generar un PIN único (probé ${pinBase} y ${pinAlterno}, ambos ocupados). Asígnale uno manualmente.`
  );
}

async function main() {
  const pinesUsados = new Set();
  const resultados = [];

  for (const [nombre, fecha] of CONDUCTORES) {
    let pin;
    try {
      pin = generarPin(nombre, fecha, pinesUsados);
    } catch (e) {
      console.error(`❌ ${nombre}: ${e.message}`);
      resultados.push({ nombre, pin: "-", estado: `ERROR: ${e.message}` });
      continue;
    }

    const email = pinToEmail(pin);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
    });

    if (error) {
      console.error(`❌ ${nombre}: ${error.message}`);
      resultados.push({ nombre, pin, estado: `ERROR: ${error.message}` });
      continue;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ nombre_completo: nombre })
      .eq("id", data.user.id);

    if (profileError) {
      console.error(`⚠️  ${nombre}: creado pero no se pudo guardar el nombre`);
      resultados.push({ nombre, pin, estado: "creado, sin nombre" });
      continue;
    }

    console.log(`✅ ${nombre} -> PIN ${pin}`);
    resultados.push({ nombre, pin, estado: "OK" });
  }

  console.log("\n=== RESUMEN (guarda esto para repartir los PIN) ===");
  console.table(resultados);
}

main();
