import express from 'express'
import cors    from 'cors'
import helmet  from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from '../config/env'
import { errorMiddleware } from './middlewares/error.middleware'
import animeRoutes        from './routes/anime.routes'
import usuarioRoutes      from './routes/usuario.routes'
import bibliotecaRoutes   from './routes/biblioteca.routes'
import resenaRoutes       from './routes/resena.routes'
import comunidadRoutes    from './routes/comunidad.routes'
import coleccionRoutes    from './routes/coleccion.routes'
import feedRoutes         from './routes/feed.routes'
import rankingRoutes      from './routes/ranking.routes'
import notificacionRoutes from './routes/notificacion.routes'
import noticiasRoutes     from './routes/noticias.routes'
import plantillaRoutes    from './routes/plantilla.routes'
import reporteRoutes      from './routes/reporte.routes'

const app = express()

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Límite por IP (aumentado para desarrollo)
  message: { error: 'Demasiadas peticiones. Intente nuevamente en 15 minutos.' }
})

app.use(helmet())
app.use(limiter)
const ALLOWED_ORIGINS = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]
app.use(cors({ origin: (origin, cb) => {
  // Allow requests with no origin (e.g. curl, Postman)
  if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
  
  // Allow any localhost/127.0.0.1 port for Vite development flexibility
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    return cb(null, true)
  }

  // Allow Vercel preview/production deployments
  if (origin.endsWith('.vercel.app')) {
    return cb(null, true)
  }

  cb(new Error(`CORS: origin ${origin} not allowed`))
}, credentials: true }))
app.use(express.json({ limit: '5mb' }))

app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'Nakama API' }))

app.use('/api/animes',         animeRoutes)
app.use('/api/usuarios',       usuarioRoutes)
app.use('/api/biblioteca',     bibliotecaRoutes)
app.use('/api/resenas',        resenaRoutes)
app.use('/api/comunidades',    comunidadRoutes)
app.use('/api/colecciones',    coleccionRoutes)
app.use('/api/feed',           feedRoutes)
app.use('/api/ranking',        rankingRoutes)
app.use('/api/notificaciones', notificacionRoutes)
app.use('/api/noticias',       noticiasRoutes)
app.use('/api/plantillas',     plantillaRoutes)
app.use('/api/reportes',       reporteRoutes)

app.use(errorMiddleware)

export default app
