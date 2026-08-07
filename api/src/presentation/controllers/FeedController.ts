import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container } from '../../infrastructure/container'
import { AppError } from '../middlewares/error.middleware'

export class FeedController {
  getFeed = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const limit = Number(req.query.limit) || 20
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null
      const resultado = await container.obtenerFeed.execute({
        usuarioId: req.userId,
        cursor,
        limit,
      })
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }
  postFeed = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { contenido, tema, soloAmigos, tipo, opciones, imagenUrl } = req.body
      const nuevaPub = await container.crearPublicacionFeed.execute({
        usuarioId: req.userId,
        contenido,
        tema,
        soloAmigos,
        tipo,
        opciones,
        imagenUrl,
      })
      res.status(201).json(nuevaPub)
    } catch (err) {
      next(err)
    }
  }

  deleteFeedItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { tipo, id } = req.params

      if (tipo === 'resena') {
        await container.eliminarResena.execute({ resenaId: id, usuarioId: req.userId })
        await container.eliminarFeedResena.execute(id, req.userId)
      } else if (tipo === 'publicacion') {
        await container.eliminarPublicacionFeed.execute(id, req.userId)
      }
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }

  toggleLike = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { tipo, id } = req.params

      if (tipo === 'resena') {
        const resultado = await container.toggleLikeResena.execute({
          usuarioId: req.userId,
          resenaId: id,
        })
        return res.json(resultado)
      } else if (tipo === 'publicacion') {
        const resultado = await container.toggleLikePublicacion.execute(id, req.userId)
        return res.json(resultado)
      }
      res.status(400).json({ error: 'Tipo invalido' })
    } catch (err) {
      next(err)
    }
  }

  getComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { tipo, id } = req.params
      const comentarios = await container.obtenerComentarios.execute(tipo, id)
      res.json(comentarios)
    } catch (err) {
      next(err)
    }
  }

  postComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { tipo, id } = req.params
      const { contenido, padreId } = req.body
      if (!contenido || !contenido.trim()) throw new AppError('Comentario vacio', 400)

      const nuevo = await container.crearComentario.execute({
        tipo,
        id,
        usuarioId: req.userId,
        contenido,
        padreId,
      })
      res.status(201).json(nuevo)
    } catch (err) {
      next(err)
    }
  }

  deleteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { tipo, id, comentarioId } = req.params
      await container.eliminarComentario.execute(tipo, id, comentarioId, req.userId)
      res.status(200).json({ ok: true })
    } catch (err) {
      next(err)
    }
  }
}
