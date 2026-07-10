import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container }   from '../../infrastructure/container'
import { AppError }    from '../middlewares/error.middleware'

export class FeedController {
  getFeed = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const page  = Number(req.query.page)  || 1
      const limit = Number(req.query.limit) || 20
      const resultado = await container.obtenerFeed.execute({
        usuarioId: req.userId,
        page,
        limit,
      })
      res.json(resultado)
    } catch (err) { next(err) }
  }
}
