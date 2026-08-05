import { prisma }             from '../database/prisma/client'
import { IAnimeRepository, AnimeFilters, RankingItem } from '../../domain/repositories/IAnimeRepository'
import { Anime }              from '../../domain/entities/Anime'

export class PrismaAnimeRepository implements IAnimeRepository {

  private mapear(raw: any): Anime {
    return {
      id:                   raw.id,
      externalId:           raw.externalId,
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
      autor:                raw.autor          ?? undefined,
      demografia:           raw.demografia     ?? undefined,
      creadoEn:             raw.creadoEn,
      actualizadoEn:        raw.actualizadoEn,
    }
  }

  async findById(id: string): Promise<Anime | null> {
    const raw = await prisma.anime.findUnique({ where: { id } })
    return raw ? this.mapear(raw) : null
  }

  async findByExternalId(externalId: string): Promise<Anime | null> {
    const raw = await prisma.anime.findUnique({ where: { externalId } })
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
    // Verificar si ya existe con score guardado
    const existing = await prisma.anime.findUnique({ where: { externalId: data.externalId! }, select: { calificacionPromedio: true } })
    const hasExistingScore = existing && Number(existing.calificacionPromedio) > 0

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
      autor:                data.autor,
      demografia:           data.demografia,
      // Solo actualizar la calificacion si NO hay una existente ya guardada (para no pisarla con datos de Kitsu)
      ...(hasExistingScore ? {} : { calificacionPromedio: data.calificacionPromedio }),
    }
    const raw = await prisma.anime.upsert({
      where:  { externalId: data.externalId! },
      create: { externalId: data.externalId!, ...payload, calificacionPromedio: data.calificacionPromedio },
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
  async getRankingMasVistos(limit: number): Promise<RankingItem[]> {
    type ListaGroupRow = { animeId: string; _count: { animeId: number } }
    const rows = (await (prisma.listaUsuario.groupBy as any)({
      by: ['animeId'],
      where: { estados: { has: 'Viendo' } },
      _count: { animeId: true },
      orderBy: { _count: { animeId: 'desc' } },
      take: limit,
    })) as unknown as ListaGroupRow[]
    const animeIds = rows.map((r: ListaGroupRow) => r.animeId)
    const animes = await prisma.anime.findMany({ where: { id: { in: animeIds } } })
    const animeMap = new Map<string, any>(animes.map((a: any) => [a.id, a]))
    return rows
      .map((r: ListaGroupRow) => ({ anime: this.mapear(animeMap.get(r.animeId)!), count: r._count.animeId }))
      .filter((r: any) => r.anime)
  }

  async getRankingMasGustados(limit: number): Promise<RankingItem[]> {
    type ListaGroupRow = { animeId: string; _count: { animeId: number } }
    const rows = (await (prisma.listaUsuario.groupBy as any)({
      by: ['animeId'],
      where: { estados: { has: 'Me gusta' } },
      _count: { animeId: true },
      orderBy: { _count: { animeId: 'desc' } },
      take: limit,
    })) as unknown as ListaGroupRow[]
    const animeIds = rows.map((r: ListaGroupRow) => r.animeId)
    const animes = await prisma.anime.findMany({ where: { id: { in: animeIds } } })
    const animeMap = new Map<string, any>(animes.map((a: any) => [a.id, a]))
    return rows
      .map((r: ListaGroupRow) => ({ anime: this.mapear(animeMap.get(r.animeId)!), count: r._count.animeId }))
      .filter((r: any) => r.anime)
  }
}
