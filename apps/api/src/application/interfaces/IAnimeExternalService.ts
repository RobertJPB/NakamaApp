import { Anime } from '../../domain/entities/Anime'

/**
 * Contrato para cualquier fuente externa de datos de anime.
 * Permite intercambiar AniList por Kitsu, Jikan, etc.
 * sin tocar los use cases — solo cambia la implementación en container.ts.
 */
export interface IAnimeExternalService {
  buscarAnimes(busqueda: string, pagina?: number): Promise<{
    pageInfo?: { total: number; currentPage: number; lastPage: number }
    animes: Partial<Anime>[]
  }>

  obtenerDetalle(anilistId: number): Promise<{
    anime: Partial<Anime>
    personajes: any[]
  }>

  obtenerPopulares(pagina?: number): Promise<Partial<Anime>[]>
}
