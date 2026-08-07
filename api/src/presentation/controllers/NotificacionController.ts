import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { AppError } from '../middlewares/error.middleware'
import { container } from '../../infrastructure/container'

export class NotificacionController {
  listar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const notificaciones = await container.listarNotificaciones.execute(req.userId)
      res.json(notificaciones)
    } catch (err) {
      next(err)
    }
  }

  marcarTodasLeidas = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await container.marcarTodasLeidas.execute(req.userId)
      res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' })
    } catch (err) {
      next(err)
    }
  }

  marcarLeida = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await container.marcarLeida.execute(req.params.id, req.userId)
      res.json({ mensaje: 'Notificación marcada como leída', id: req.params.id })
    } catch (err) {
      next(err)
    }
  }
}
