# Control de Combustible

App para reemplazar la planilla en papel de "Consumo de Bencina Transporte".
Los conductores cargan cada carga de combustible desde el celular; el
administrador ve todo en una tabla tipo libro de registro y puede descargar
la planilla en Excel cuando la necesite.

## Qué incluye

- **Login con roles**: cada conductor crea su cuenta (queda como
  "conductor" por defecto); tú asciendes a quien necesites a "admin".
- **Formulario de carga** (`/carga`): fecha, hora, KM, vehículo, conteo
  inicial y litros — igual a las columnas de la planilla en papel. El mes y
  el conteo final se calculan solos.
- **Panel de administración** (`/admin`): tabla con todos los registros,
  filtros por fecha/vehículo/conductor, y botón **"Descargar planilla
  (.xlsx)"** que genera un Excel con las mismas columnas de la planilla
  original.
- **Gestión de vehículos y conductores** (`/admin/vehiculos`,
  `/admin/conductores`).

## 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New project**.
2. Cuando esté listo, entra a **SQL Editor** → **New query**, pega todo el
   contenido de [`supabase/schema.sql`](./supabase/schema.sql) y presiona
   **Run**. Esto crea las tablas, las reglas de seguridad (RLS) y el
   trigger que crea un perfil automáticamente cuando alguien se registra.
3. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public` key

## 2. Configurar el proyecto localmente

```bash
npm install
cp .env.local.example .env.local
```

Pega la URL y la `anon key` de Supabase en `.env.local`.

```bash
npm run dev
```

Abre `http://localhost:3000`, crea una cuenta desde `/login` (queda como
conductor). Luego en Supabase → **Table Editor → profiles**, cambia tu
`role` a `admin` para entrar al panel de administración. También puedes
ejecutar esto en el SQL Editor (reemplaza el correo):

```sql
update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = 'tu-correo@empresa.cl');
```

Después agrega tus vehículos desde **Admin → Vehículos**.

## 3. Subir el código a GitHub

```bash
git init
git add .
git commit -m "Control de combustible - primera versión"
```

Crea un repositorio nuevo y vacío en GitHub, luego:

```bash
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git branch -M main
git push -u origin main
```

## 4. Desplegar en Vercel

1. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el
   repositorio de GitHub que acabas de crear.
2. En **Environment Variables**, agrega las mismas dos variables de tu
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy**. Cada vez que hagas `git push` a `main`, Vercel vuelve a
   desplegar automáticamente.

## Cómo se usa día a día

- **Conductores**: entran a la URL de la app desde el celular, inician
  sesión y registran cada carga en `/carga`. Queda guardada al instante.
- **Administrador**: entra a `/admin`, filtra por fecha o vehículo si
  quiere, y presiona **Descargar planilla (.xlsx)** para tener la data en
  Excel, igual que antes con la planilla en papel.

## Estructura del proyecto

```
src/app/login          → inicio de sesión / registro
src/app/carga           → formulario de carga (conductores)
src/app/admin            → tabla de registros + exportar (admin)
src/app/admin/vehiculos → alta y baja de vehículos
src/app/admin/conductores → ascender/desactivar conductores
src/lib/supabase        → clientes de Supabase (browser, server, middleware)
supabase/schema.sql      → todo el esquema de base de datos y seguridad
```
