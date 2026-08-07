import { prisma } from '../database/prisma/client'
import { INoticiaRepository } from '../../domain/repositories/INoticiaRepository'

export class PrismaNoticiaRepository implements INoticiaRepository {
  async getRecientes(limit: number): Promise<any[]> {
    return prisma.noticia.findMany({
      take: limit,
      orderBy: { fechaPublicacion: 'desc' },
    })
  }

  async getPopulares(): Promise<any[]> {
    return prisma.noticia.findMany({
      orderBy: { fechaPublicacion: 'desc' },
      take: 3,
    })
  }
}
