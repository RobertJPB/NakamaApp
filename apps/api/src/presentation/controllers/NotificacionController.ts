import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { AppError }    from '../middlewares/error.middleware'

export class NotificacionController {
  listar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      // Placeholder hasta que se implemente el caso de uso de notificaciones
      res.json({ usuarioId: req.userId, notificaciones: [] })
    } catch (err) { next(err) }
  }

  marcarTodasLeidas = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' })
    } catch (err) { next(err) }
  }

  marcarLeida = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      res.json({ mensaje: 'Notificación marcada como leída', id: req.params.id })
    } catch (err) { next(err) }
  }
}
