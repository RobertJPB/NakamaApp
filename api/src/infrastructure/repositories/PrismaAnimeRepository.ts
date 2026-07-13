import { prisma }             from '../database/prisma/client'
import { IAnimeRepository, AnimeFilters } from '../../domain/repositories/IAnimeRepository'
import { Anime }              from '../../domain/entities/Anime'

export class PrismaAnimeRepository implements IAnimeRepository {

  private mapear(raw: any): Anime {
    return {
      id:                   raw.id,
      anilistId:            raw.anilistId,
      titulo:               raw.titulo,
      tituloJapones:        raw.tituloJapones  ?? undefined,
      tituloRomaji:         raw.tituloRomaji   ?? undefined,
      imagenUrl:            raw.imagenUrl      ?? undefined,
      bannerUrl:            raw.bannerUrl      ?? undefined,
      sinopsis:             raw.sinopsis       ?? undefined,
      estadoEmision:        raw.estadoEmision  ?? undefined,
      episodios:            raw.episodios      ?? undefined,
      duracionMin:          raw.duracionMin    ?? undefined,
      temporada:            raw.temporada      ?? undefined,
      anio:                 raw.anio           ?? undefined,
      tipo:                 raw.tipo           ?? undefined,
      estudio:              raw.estudio        ?? undefined,
      calificacionPromedio: Number(raw.calificacionPromedio),
      totalResenas:         raw.totalResenas,
      totalEnListas:        raw.totalEnListas,
      creadoEn:             raw.creadoEn,
      actualizadoEn:        raw.actualizadoEn,
    }
  }

  async findById(id: string): Promise<Anime | null> {
    const raw = await prisma.anime.findUnique({ where: { id } })
    return raw ? this.mapear(raw) : null
  }

  async findByAniListId(anilistId: number): Promise<Anime | null> {
    const raw = await prisma.anime.findUnique({ where: { anilistId } })
    return raw ? this.mapear(raw) : null
  }

  async findMany(filters: AnimeFilters, page: number, limit: number): Promise<Anime[]> {
    const skip = (page - 1) * limit
    const where: any = {}

    if (filters.busqueda) {
      where.OR = [
        { titulo:       { contains: filters.busqueda, mode: 'insensitive' } },
        { tituloRomaji: { contains: filters.busqueda, mode: 'insensitive' } },
      ]
    }
    if (filters.temporada) where.temporada = filters.temporada
    if (filters.anio)      where.anio      = filters.anio
    if (filters.tipo)      where.tipo      = filters.tipo
    if (filters.genero) {
      where.generos = {
        some: { genero: { nombre: { contains: filters.genero, mode: 'insensitive' } } }
      }
    }
    if (filters.demografia) {
      where.demografias = {
        some: { demografia: { nombre: { contains: filters.demografia, mode: 'insensitive' } } }
      }
    }

    const rows = await prisma.anime.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { calificacionPromedio: 'desc' },
    })
    return rows.map(this.mapear)
  }

  async upsert(data: Partial<Anime>): Promise<Anime> {
    const payload = {
      titulo:               data.titulo!,
      tituloJapones:        data.tituloJapones,
      tituloRomaji:         data.tituloRomaji,
      imagenUrl:            data.imagenUrl,
      bannerUrl:            data.bannerUrl,
      sinopsis:             data.sinopsis,
      estadoEmision:        data.estadoEmision,
      episodios:            data.episodios,
      duracionMin:          data.duracionMin,
      temporada:            data.temporada,
      anio:                 data.anio,
      tipo:                 data.tipo,
      estudio:              data.estudio,
    }
    const raw = await prisma.anime.upsert({
      where:  { anilistId: data.anilistId! },
      create: { anilistId: data.anilistId!, ...payload },
      update: payload,
    })
    return this.mapear(raw)
  }

  async getRanking(limit: number): Promise<Anime[]> {
    const rows = await prisma.anime.findMany({
      orderBy: [
        { calificacionPromedio: 'desc' },
        { totalResenas:         'desc' },
      ],
      take: limit,
    })
    return rows.map(this.mapear)
  }

  async getRankingTemporada(): Promise<Anime[]> {
    const rows = await prisma.anime.findMany({
      where:   { estadoEmision: 'RELEASING' },
      orderBy: { calificacionPromedio: 'desc' },
      take:    50,
    })
    return rows.map(this.mapear)
  }
}
