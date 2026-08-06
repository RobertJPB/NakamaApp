import { prisma }               from '../database/prisma/client'
import { IPlantillaRepository } from '../../domain/repositories/IPlantillaRepository'

export class PrismaPlantillaRepository implements IPlantillaRepository {

  async listar(): Promise<any[]> {
    return prisma.plantillaTierList.findMany({
      orderBy: { creadoEn: 'desc' },
      include: {
        usuario: {
          select: {
            username: true,
            nombreDisplay: true,
            avatarUrl: true
          }
        }
      },
      take: 50
    })
  }

  async crear(dto: { nombre: string; datos: unknown; usuarioId: string }): Promise<any> {
    return prisma.plantillaTierList.create({
      data: {
        nombre: dto.nombre,
        datos: dto.datos as any,
        usuarioId: dto.usuarioId
      },
      include: {
        usuario: {
          select: {
            username: true,
            nombreDisplay: true,
            avatarUrl: true
          }
        }
      }
    })
  }
}
