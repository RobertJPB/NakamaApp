import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container } from '../../infrastructure/container'
import { AppError } from '../middlewares/error.middleware'

/**
 * SRP: solo maneja HTTP (parsear request, llamar caso de uso, devolver response)
 * DIP: usa el container, no instancia nada directamente
 */
export class ResenaController {
  recientes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = Number(req.query.limit) || 8
      const resenas = await container.obtenerResenasRecientes.execute(limit)

      res.json(resenas)
    } catch (error) {
      next(error)
    }
  }

  buscar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const q = String(req.query.q ?? '').trim()
      if (q.length < 2) return res.json([])

      const resenas = await container.buscarResenas.execute(q)

      res.json(resenas)
    } catch (error) {
      next(error)
    }
  }

  porAnime = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { animeId } = req.params
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20

      const result = await container.obtenerResenasPorAnime.execute(animeId, page, limit)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  porUsuario = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { usuarioId } = req.params
      const result = await container.obtenerResenasPorUsuario.execute(usuarioId)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  crear = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)

      let animeIdEnDb = req.body.animeId
      // Si el frontend envía un ID de Kitsu (string), debemos asegurar que el anime exista
      if (animeIdEnDb && !animeIdEnDb.includes('-')) {
        // Si no es un UUID, asume que es externalId
        const { anime } = await container.obtenerDetalleAnime.execute(String(animeIdEnDb))
        animeIdEnDb = anime.id
      }

      const resena = await container.crearResena.execute({
        usuarioId: req.userId,
        animeId: animeIdEnDb,
        calificacion: req.body.calificacion,
        contenido: req.body.contenido,
        contieneSpoiler: req.body.contieneSpoiler ?? false,
        esPublica: req.body.esPublica ?? true,
        fechaVisto: req.body.fechaVisto,
        etiquetas: req.body.etiquetas,
      })
      res.status(201).json(resena)
    } catch (err) {
      next(err)
    }
  }

  eliminar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await container.eliminarResena.execute({ resenaId: req.params.id, usuarioId: req.userId })
      res.json({ mensaje: 'Reseña eliminada correctamente' })
    } catch (err) {
      next(err)
    }
  }

  editar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const resena = await container.editarResena.execute({
        resenaId: req.params.id,
        usuarioId: req.userId,
        calificacion: req.body.calificacion,
        contenido: req.body.contenido,
        contieneSpoiler: req.body.contieneSpoiler,
        esPublica: req.body.esPublica,
        etiquetas: req.body.etiquetas,
      })
      res.json(resena)
    } catch (err) {
      next(err)
    }
  }

  toggleLike = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const resultado = await container.toggleLikeResena.execute({
        usuarioId: req.userId,
        resenaId: req.params.id,
      })
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }
}
