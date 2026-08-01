import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { AppError }    from '../middlewares/error.middleware'

export class NotificacionController {
  listar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { prisma } = require('../../infrastructure/database/prisma/client')
      const notificaciones = await prisma.notificacion.findMany({
        where: { usuarioId: req.userId },
        orderBy: { creadoEn: 'desc' },
        take: 30,
        include: {
          actor: { select: { username: true, nombreDisplay: true, avatarUrl: true } }
        }
      })
      res.json(notificaciones)
    } catch (err) { next(err) }
  }

  marcarTodasLeidas = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { prisma } = require('../../infrastructure/database/prisma/client')
      await prisma.notificacion.updateMany({
        where: { usuarioId: req.userId, leida: false },
        data: { leida: true }
      })
      res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' })
    } catch (err) { next(err) }
  }

  marcarLeida = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { prisma } = require('../../infrastructure/database/prisma/client')
      await prisma.notificacion.updateMany({
        where: { id: req.params.id, usuarioId: req.userId },
        data: { leida: true }
      })
      res.json({ mensaje: 'Notificación marcada como leída', id: req.params.id })
    } catch (err) { next(err) }
  }
}
