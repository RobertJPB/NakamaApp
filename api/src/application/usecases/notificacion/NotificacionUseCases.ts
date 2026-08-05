import { PrismaClient } from '@prisma/client'

export class ListarNotificaciones {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(usuarioId: string) {
    return this.prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { creadoEn: 'desc' },
      take: 30,
      include: {
        actor: { select: { username: true, nombreDisplay: true, avatarUrl: true } }
      }
    })
  }
}

export class MarcarTodasLeidas {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(usuarioId: string) {
    await this.prisma.notificacion.updateMany({
      where: { usuarioId, leida: false },
      data: { leida: true }
    })
  }
}

export class MarcarLeida {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(id: string, usuarioId: string) {
    await this.prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { leida: true }
    })
  }
}
