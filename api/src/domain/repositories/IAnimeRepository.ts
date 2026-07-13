import { Anime } from '../entities/Anime'

export interface AnimeFilters {
  busqueda?:   string
  genero?:     string
  demografia?: string
  temporada?:  string
  anio?:       number
  tipo?:       string
}

export interface IAnimeRepository {
  findById(id: string): Promise<Anime | null>
  findByAniListId(anilistId: number): Promise<Anime | null>
  findMany(filters: AnimeFilters, page: number, limit: number): Promise<Anime[]>
  upsert(data: Partial<Anime>): Promise<Anime>
  getRanking(limit: number): Promise<Anime[]>
  getRankingTemporada(): Promise<Anime[]>
}
