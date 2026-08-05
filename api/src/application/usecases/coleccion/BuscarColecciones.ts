import { PrismaClient } from '@prisma/client'

export class BuscarColecciones {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: string) {
    if (query.length < 2) return []

    const colecciones = await this.prisma.coleccion.findMany({
      where: {
        esPublica: true,
        OR: [
          { titulo: { contains: query, mode: 'insensitive' } },
          { descripcion: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 50,
      include: {
        usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true } },
        _count: { select: { animes: true } }
      },
      orderBy: { creadoEn: 'desc' }
    })
    return colecciones
  }
}
