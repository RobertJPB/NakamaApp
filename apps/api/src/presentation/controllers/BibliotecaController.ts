import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container }   from '../../infrastructure/container'
import { AppError }    from '../middlewares/error.middleware'

export class BibliotecaController {

  getLista = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ usuarioId: req.params.usuarioId, lista: [] })
    } catch (err) { next(err) }
  }

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ usuarioId: req.params.usuarioId, stats: {} })
    } catch (err) { next(err) }
  }

  getRuleta = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Devuelve animes en estado "pendiente" del usuario para la ruleta
      res.json({ usuarioId: req.params.usuarioId, animes: [] })
    } catch (err) { next(err) }
  }

  agregar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const entrada = await container.agregarALista.execute({
        usuarioId:       req.userId,
        animeId:         req.body.animeId,
        estado:          req.body.estado,
        episodiosVistos: req.body.episodiosVistos,
        esPrivada:       req.body.esPrivada,
        notasPrivadas:   req.body.notasPrivadas,
      })
      res.status(201).json(entrada)
    } catch (err) { next(err) }
  }

  actualizar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const entrada = await container.agregarALista.execute({
        usuarioId: req.userId,
        animeId:   req.params.animeId,
        ...req.body,
      })
      res.json(entrada)
    } catch (err) { next(err) }
  }

  eliminar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await container.eliminarDeLista.execute({
        usuarioId: req.userId,
        animeId:   req.params.animeId,
      })
      res.status(204).send()
    } catch (err) { next(err) }
  }
}
