import express from 'express'
import cors    from 'cors'
import helmet  from 'helmet'
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

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
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

app.use(errorMiddleware)

export default app
