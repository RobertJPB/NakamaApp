import { prisma }            from '../database/prisma/client'
import { IResenaRepository } from '../../domain/repositories/IResenaRepository'
import { Resena }            from '../../domain/entities/Resena'

export class PrismaResenaRepository implements IResenaRepository {

  private mapear(raw: any): Resena {
    return {
      id:              raw.id,
      usuarioId:       raw.usuarioId,
      animeId:         raw.animeId,
      calificacion:    raw.calificacion,
      contenido:       raw.contenido    ?? undefined,
      contieneSpoiler: raw.contieneSpoiler,
      esPublica:       raw.esPublica,
      totalLikes:      raw.totalLikes,
      creadoEn:        raw.creadoEn,
      editadoEn:       raw.editadoEn   ?? undefined,
    }
  }

  async findById(id: string): Promise<Resena | null> {
    const raw = await prisma.resena.findUnique({ where: { id } })
    return raw ? this.mapear(raw) : null
  }

  async findByUsuarioYAnime(usuarioId: string, animeId: string): Promise<Resena | null> {
    const raw = await prisma.resena.findUnique({
      where: { usuarioId_animeId: { usuarioId, animeId } },
    })
    return raw ? this.mapear(raw) : null
  }

  async findByAnime(animeId: string, page: number, limit: number): Promise<Resena[]> {
    const rows = await prisma.resena.findMany({
      where:   { animeId, esPublica: true },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { creadoEn: 'desc' },
      include: { usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true } } },
    })
    return rows.map(this.mapear)
  }

  async findByUsuario(usuarioId: string, page: number, limit: number): Promise<Resena[]> {
    const rows = await prisma.resena.findMany({
      where:   { usuarioId },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { creadoEn: 'desc' },
    })
    return rows.map(this.mapear)
  }

  async upsert(data: Partial<Resena>): Promise<Resena> {
    const payload = {
      calificacion:    data.calificacion!,
      contenido:       data.contenido,
      contieneSpoiler: data.contieneSpoiler ?? false,
      esPublica:       data.esPublica       ?? true,
      editadoEn:       data.editadoEn ? new Date() : undefined,
    }
    const raw = await prisma.resena.upsert({
      where:  { usuarioId_animeId: { usuarioId: data.usuarioId!, animeId: data.animeId! } },
      create: { usuarioId: data.usuarioId!, animeId: data.animeId!, ...payload },
      update: payload,
    })
    return this.mapear(raw)
  }

  async delete(id: string, usuarioId: string): Promise<void> {
    await prisma.resena.deleteMany({ where: { id, usuarioId } })
  }

  async toggleLike(usuarioId: string, resenaId: string) {
    const existente = await prisma.reaccionResena.findUnique({
      where: { usuarioId_resenaId: { usuarioId, resenaId } },
    })

    if (existente) {
      await prisma.reaccionResena.delete({
        where: { usuarioId_resenaId: { usuarioId, resenaId } },
      })
      return { accion: 'unliked' as const }
    }

    await prisma.reaccionResena.create({ data: { usuarioId, resenaId } })
    return { accion: 'liked' as const }
  }
}
