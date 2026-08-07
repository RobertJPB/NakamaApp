import { prisma } from '../database/prisma/client'
import { IListaRepository, EntradaLista } from '../../domain/repositories/IListaRepository'
export class PrismaListaRepository implements IListaRepository {
  private mapear(raw: any): EntradaLista {
    return {
      id: raw.id,
      usuarioId: raw.usuarioId,
      animeId: raw.animeId,
      estados: raw.estados,
      episodiosVistos: raw.episodiosVistos,
      esFavorito: raw.esFavorito,
      esPrivada: raw.esPrivada,
      notasPrivadas: raw.notasPrivadas ?? undefined,
      actualizadoEn: raw.actualizadoEn,
      anime: raw.anime,
    }
  }

  async findByUsuario(usuarioId: string, estado?: string): Promise<EntradaLista[]> {
    const rows = await prisma.listaUsuario.findMany({
      where: { usuarioId, ...(estado ? { estados: { has: estado } } : {}) },
      orderBy: { actualizadoEn: 'desc' },
      include: {
        anime: {
          select: {
            titulo: true,
            imagenUrl: true,
            externalId: true,
            episodios: true,
            tipo: true,
            estadoEmision: true,
            demografia: true,
            calificacionPromedio: true,
          },
        },
      },
    })
    return rows.map(this.mapear)
  }

  async findEntrada(usuarioId: string, animeId: string): Promise<EntradaLista | null> {
    const raw = await prisma.listaUsuario.findUnique({
      where: { usuarioId_animeId: { usuarioId, animeId } },
    })
    return raw ? this.mapear(raw) : null
  }

  async upsert(data: Partial<EntradaLista>): Promise<EntradaLista> {
    const payload = {
      episodiosVistos: data.episodiosVistos ?? 0,
      esFavorito: data.esFavorito ?? false,
      esPrivada: data.esPrivada ?? false,
      notasPrivadas: data.notasPrivadas,
    }
    const raw = await prisma.listaUsuario.upsert({
      where: { usuarioId_animeId: { usuarioId: data.usuarioId!, animeId: data.animeId! } },
      create: {
        usuarioId: data.usuarioId!,
        animeId: data.animeId!,
        estados: data.estados ?? [],
        ...payload,
      },
      update: {
        estados: data.estados,
        ...payload,
      },
    })
    return this.mapear(raw)
  }

  async delete(usuarioId: string, animeId: string): Promise<void> {
    await prisma.listaUsuario.deleteMany({ where: { usuarioId, animeId } })
  }

  async getStats(usuarioId: string): Promise<Record<string, number>> {
    const rows = await prisma.listaUsuario.findMany({
      where: { usuarioId },
      select: { estados: true },
    })
    const stats: Record<string, number> = {}
    rows.forEach((r: { estados: string[] }) => {
      r.estados.forEach((e: string) => {
        stats[e] = (stats[e] || 0) + 1
      })
    })
    return stats
  }

  async getParaRuleta(usuarioId: string): Promise<EntradaLista[]> {
    const rows = await prisma.listaUsuario.findMany({
      where: { usuarioId, estados: { has: 'pendiente' }, esPrivada: false },
      include: { anime: { select: { titulo: true, imagenUrl: true, externalId: true } } },
    })
    return rows.map(this.mapear)
  }
}
