import { prisma }           from '../database/prisma/client'
import { IListaRepository, EntradaLista } from '../../domain/repositories/IListaRepository'
import { EstadoListaType }  from '../../domain/value-objects/EstadoLista'

export class PrismaListaRepository implements IListaRepository {

  private mapear(raw: any): EntradaLista {
    return {
      id:              raw.id,
      usuarioId:       raw.usuarioId,
      animeId:         raw.animeId,
      estado:          raw.estado as EstadoListaType,
      episodiosVistos: raw.episodiosVistos,
      esFavorito:      raw.esFavorito,
      esPrivada:       raw.esPrivada,
      notasPrivadas:   raw.notasPrivadas ?? undefined,
      actualizadoEn:   raw.actualizadoEn,
    }
  }

  async findByUsuario(usuarioId: string, estado?: EstadoListaType): Promise<EntradaLista[]> {
    const rows = await prisma.listaUsuario.findMany({
      where:   { usuarioId, ...(estado ? { estado } : {}) },
      orderBy: { actualizadoEn: 'desc' },
      include: { anime: { select: { titulo: true, imagenUrl: true, anilistId: true, episodios: true } } },
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
      estado:          data.estado!,
      episodiosVistos: data.episodiosVistos ?? 0,
      esFavorito:      data.esFavorito      ?? false,
      esPrivada:       data.esPrivada       ?? false,
      notasPrivadas:   data.notasPrivadas,
    }
    const raw = await prisma.listaUsuario.upsert({
      where:  { usuarioId_animeId: { usuarioId: data.usuarioId!, animeId: data.animeId! } },
      create: { usuarioId: data.usuarioId!, animeId: data.animeId!, ...payload },
      update: payload,
    })
    return this.mapear(raw)
  }

  async delete(usuarioId: string, animeId: string): Promise<void> {
    await prisma.listaUsuario.deleteMany({ where: { usuarioId, animeId } })
  }

  async getStats(usuarioId: string) {
    const grupos = await prisma.listaUsuario.groupBy({
      by:    ['estado'],
      where: { usuarioId },
      _count: { estado: true },
    })
    const stats: Record<string, number> = {
      viendo: 0, completado: 0, pendiente: 0, en_pausa: 0, abandonado: 0,
    }
    grupos.forEach(g => { stats[g.estado] = g._count.estado })
    return stats as Record<EstadoListaType, number>
  }

  async getParaRuleta(usuarioId: string): Promise<EntradaLista[]> {
    const rows = await prisma.listaUsuario.findMany({
      where:   { usuarioId, estado: 'pendiente', esPrivada: false },
      include: { anime: { select: { titulo: true, imagenUrl: true, anilistId: true } } },
    })
    return rows.map(this.mapear)
  }
}
