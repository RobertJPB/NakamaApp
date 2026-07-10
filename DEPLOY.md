# Nakama — Guía de Deploy

## Requisitos previos
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Railway](https://railway.app)
- Cuenta en [Vercel](https://vercel.com)
- Repositorio en GitHub

---

## 1. Supabase — Base de datos y Auth

### 1.1 Crear proyecto
1. Entrar a supabase.com → New project
2. Elegir nombre: `nakama`
3. Guardar la contraseña de base de datos

### 1.2 Obtener credenciales
En **Settings → API**:
- `SUPABASE_URL` → Project URL
- `SUPABASE_ANON_KEY` → anon public key

En **Settings → Database → Connection string**:
- `DATABASE_URL` → URI con `?pgbouncer=true` al final
- `DIRECT_URL` → Direct connection (sin pgbouncer)

### 1.3 Configurar Auth
En **Authentication → Providers**:
- Email/Password → Habilitar
- Desactivar "Confirm email" durante desarrollo

### 1.4 Configurar variables y migrar
```bash
cd apps/api
cp .env.example .env
# Llenar con las credenciales de Supabase

pnpm db:generate    # Genera el cliente Prisma
pnpm db:push        # Crea las tablas en Supabase
pnpm db:seed        # Carga géneros, demografías y colecciones iniciales
```

---

## 2. Railway — Backend API

### 2.1 Crear servicio
1. railway.app → New Project → Deploy from GitHub repo
2. Seleccionar tu repositorio de Nakama
3. En **Settings → Source**: Root directory = `apps/api`

### 2.2 Variables de entorno en Railway
```
PORT=4000
DATABASE_URL=<tu DATABASE_URL de Supabase>
DIRECT_URL=<tu DIRECT_URL de Supabase>
SUPABASE_URL=<tu SUPABASE_URL>
SUPABASE_ANON_KEY=<tu SUPABASE_ANON_KEY>
FRONTEND_URL=<URL de Vercel — se agrega después>
NODE_ENV=production
```

### 2.3 Configurar dominio
En **Settings → Networking → Generate Domain**
Guardar la URL generada (ej: `nakama-api.up.railway.app`)

---

## 3. Vercel — Frontend Web

### 3.1 Importar proyecto
1. vercel.com → Add New → Project
2. Importar repositorio de GitHub
3. **Framework Preset**: Vite
4. **Root Directory**: `apps/web`

### 3.2 Variables de entorno en Vercel
```
VITE_API_URL=https://nakama-api.up.railway.app
VITE_SUPABASE_URL=<tu SUPABASE_URL>
VITE_SUPABASE_ANON_KEY=<tu SUPABASE_ANON_KEY>
```

### 3.3 Deploy
Vercel despliega automáticamente en cada push a `main`.
Guardar la URL generada (ej: `nakama.vercel.app`).

---

## 4. Conectar todo

### 4.1 Actualizar FRONTEND_URL en Railway
En las variables de Railway agregar:
```
FRONTEND_URL=https://nakama.vercel.app
```

### 4.2 Agregar dominio de Vercel en Supabase Auth
En **Supabase → Authentication → URL Configuration**:
- Site URL: `https://nakama.vercel.app`
- Redirect URLs: `https://nakama.vercel.app/**`

---

## 5. GitHub Actions (CI/CD)

### 5.1 Secrets del repositorio
En **GitHub → Settings → Secrets and variables → Actions**:

```
VERCEL_TOKEN          → vercel.com → Settings → Tokens
VERCEL_ORG_ID         → vercel.com → Settings → General → Team ID
VERCEL_PROJECT_ID     → vercel.com → Project → Settings → General
VITE_API_URL          → URL de Railway
VITE_SUPABASE_URL     → URL de Supabase
VITE_SUPABASE_ANON_KEY → anon key de Supabase
SUPABASE_URL          → URL de Supabase (para el ping)
SUPABASE_ANON_KEY     → anon key (para el ping)
```

Cada push a `main` dispara:
1. Type check del API y Web
2. Build y deploy automático a Vercel
3. Railway detecta el push y redespliega el API solo

---

## 6. Desarrollo local

```bash
# Instalar dependencias
pnpm install

# API
cd apps/api
cp .env.example .env    # llenar credenciales
pnpm db:generate
pnpm dev                # http://localhost:4000

# Web (en otra terminal)
cd apps/web
cp .env.example .env    # llenar credenciales
pnpm dev                # http://localhost:5173
```

---

## Checklist de deploy

- [ ] Proyecto creado en Supabase
- [ ] Variables de entorno configuradas en `.env`
- [ ] `pnpm db:push` ejecutado sin errores
- [ ] `pnpm db:seed` ejecutado
- [ ] Servicio creado en Railway con variables
- [ ] `/health` responde en la URL de Railway
- [ ] Proyecto importado en Vercel con variables
- [ ] `FRONTEND_URL` actualizada en Railway
- [ ] URL de Vercel agregada en Supabase Auth
- [ ] Secrets de GitHub configurados
- [ ] Push a `main` dispara CI/CD sin errores
