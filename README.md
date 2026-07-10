# Nakama 🎌

Plataforma social de anime — biblioteca personal, reseñas, comunidades y colecciones.

## Stack

| Capa       | Tecnología                        | Hosting  |
|------------|-----------------------------------|----------|
| Frontend   | React + TypeScript                | Vercel   |
| Backend    | Node.js + Express + TypeScript    | Railway  |
| Base datos | PostgreSQL                        | Supabase |
| Auth       | Supabase Auth                     | Supabase |
| API anime  | AniList GraphQL                   | Externa  |

## Estructura

```
nakama/
├── apps/
│   ├── web/     # React + TypeScript
│   └── api/     # Node.js + Express + TypeScript
└── packages/
    └── shared/  # Tipos compartidos
```

## Capas del API (Clean Architecture)

```
src/
├── domain/          # Entidades, value objects, interfaces
├── application/     # Casos de uso
├── infrastructure/  # Prisma, AniList client, Supabase auth
└── presentation/    # Rutas, controladores, middlewares
```

## Inicio rápido

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Desarrollo
pnpm dev
```

## Variables de entorno

**API** (`apps/api/.env`)
```
PORT=4000
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=xxxx
FRONTEND_URL=http://localhost:5173
```

**Web** (`apps/web/.env`)
```
VITE_API_URL=http://localhost:4000
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```
