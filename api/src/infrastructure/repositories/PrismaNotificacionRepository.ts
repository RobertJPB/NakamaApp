import { prisma } from '../database/prisma/client'
import { INotificacionRepository } from '../../domain/repositories/INotificacionRepository'

export class PrismaNotificacionRepository implements INotificacionRepository {
  async listar(usuarioId: string): Promise<any[]> {
    return prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { creadoEn: 'desc' },
      take: 30,
      include: {
        actor: { select: { username: true, nombreDisplay: true, avatarUrl: true } },
      },
    })
  }

  async marcarTodasLeidas(usuarioId: string): Promise<void> {
    await prisma.notificacion.updateMany({
      where: { usuarioId, leida: false },
      data: { leida: true },
    })
  }

  async marcarLeida(id: string, usuarioId: string): Promise<void> {
    await prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { leida: true },
    })
  }
}
