import { Anime } from '../../domain/entities/Anime'

/**
 * Contrato para cualquier fuente externa de datos de anime.
 * Permite intercambiar AniList por Kitsu, Jikan, etc.
 * sin tocar los use cases — solo cambia la implementación en container.ts.
 */
export interface IAnimeExternalService {
  buscarAnimes(busqueda: string, pagina?: number, perPage?: number): Promise<{
    pageInfo?: { total: number; currentPage: number; lastPage: number }
    animes: Partial<Anime>[]
  }>

  obtenerDetalle(externalId: string): Promise<{
    anime: Partial<Anime>
    generos?: string[]
    personajes: any[]
  }>
  obtenerPopulares(pagina?: number, perPage?: number, genre?: string, seasonYear?: number): Promise<Partial<Anime>[]>
}
