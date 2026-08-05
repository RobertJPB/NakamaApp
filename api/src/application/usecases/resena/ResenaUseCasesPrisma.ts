import { PrismaClient } from '@prisma/client'

export class ObtenerResenasRecientes {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(limit: number) {
    return this.prisma.resena.findMany({
      where: { esPublica: true },
      orderBy: { creadoEn: 'desc' },
      take: limit,
      include: {
        anime: { select: { titulo: true, externalId: true, imagenUrl: true } },
        usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } }
      }
    })
  }
}

export class BuscarResenas {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(q: string) {
    if (q.length < 2) return []
    return this.prisma.resena.findMany({
      where: {
        esPublica: true,
        OR: [
          { contenido: { contains: q, mode: 'insensitive' } },
          { anime: { titulo: { contains: q, mode: 'insensitive' } } }
        ]
      },
      orderBy: { creadoEn: 'desc' },
      take: 50,
      include: {
        anime: { select: { titulo: true, externalId: true, imagenUrl: true } },
        usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } }
      }
    })
  }
}

export class ObtenerResenasPorAnime {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(animeId: string, page: number, limit: number) {
    const resenas = await this.prisma.resena.findMany({
      where: { animeId, esPublica: true },
      orderBy: { creadoEn: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        anime: { select: { titulo: true, externalId: true, imagenUrl: true } },
        usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } }
      }
    })
    return { animeId, page, limit, resenas }
  }
}

export class ObtenerResenasPorUsuario {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(usuarioId: string) {
    const resenas = await this.prisma.resena.findMany({
      where: { usuarioId, esPublica: true },
      orderBy: { creadoEn: 'desc' },
      include: {
        anime: { select: { titulo: true, externalId: true, imagenUrl: true } },
        usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } }
      }
    })
    return { usuarioId, resenas }
  }
}
