import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from '../config/env'
import { limiterGeneral } from './middlewares/rateLimit'
import { errorMiddleware } from './middlewares/error.middleware'
import animeRoutes from './routes/anime.routes'
import usuarioRoutes from './routes/usuario.routes'
import bibliotecaRoutes from './routes/biblioteca.routes'
import resenaRoutes from './routes/resena.routes'
import comunidadRoutes from './routes/comunidad.routes'
import coleccionRoutes from './routes/coleccion.routes'
import feedRoutes from './routes/feed.routes'
import rankingRoutes from './routes/ranking.routes'
import notificacionRoutes from './routes/notificacion.routes'
import noticiasRoutes from './routes/noticias.routes'
import plantillaRoutes from './routes/plantilla.routes'
import reporteRoutes from './routes/reporte.routes'

const app = express()

app.use(helmet())
app.use(limiterGeneral)

const ALLOWED_ORIGINS = new Set([
  'https://nakama-app-web.vercel.app',
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  ...(env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []),
])

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. curl, Postman)
      if (!origin || ALLOWED_ORIGINS.has(origin)) return cb(null, true)

      // Allow any localhost/127.0.0.1 port for Vite development flexibility
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return cb(null, true)
      }

      // Los orígenes de producción/preview deben agregarse explícitamente
      // (FRONTEND_URL o CORS_ORIGINS). Ya no se acepta cualquier subdominio .vercel.app.
      cb(new Error(`CORS: origin ${origin} not allowed. Allowed: ${Array.from(ALLOWED_ORIGINS).join(', ')}`))
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '5mb' }))

app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'Nakama API' }))

app.use('/api/animes', animeRoutes)
app.use('/api/usuarios', usuarioRoutes)
app.use('/api/biblioteca', bibliotecaRoutes)
app.use('/api/resenas', resenaRoutes)
app.use('/api/comunidades', comunidadRoutes)
app.use('/api/colecciones', coleccionRoutes)
app.use('/api/feed', feedRoutes)
app.use('/api/ranking', rankingRoutes)
app.use('/api/notificaciones', notificacionRoutes)
app.use('/api/noticias', noticiasRoutes)
app.use('/api/plantillas', plantillaRoutes)
app.use('/api/reportes', reporteRoutes)

app.use(errorMiddleware)

export default app
