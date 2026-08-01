import { IAnimeRepository } from '../../../domain/repositories/IAnimeRepository'

export interface ObtenerRankingDTO {
  tipo?: 'global' | 'temporada' | 'mas-vistos' | 'mas-gustados'
  limit?: number
}

export class ObtenerRanking {
  constructor(private readonly animeRepo: IAnimeRepository) {}

  async execute(dto: ObtenerRankingDTO) {
    const tipo  = dto.tipo  ?? 'global'
    const limit = dto.limit ?? 50

    if (tipo === 'temporada')   return this.animeRepo.getRankingTemporada()
    if (tipo === 'mas-vistos')  return this.animeRepo.getRankingMasVistos(limit)
    if (tipo === 'mas-gustados') return this.animeRepo.getRankingMasGustados(limit)
    return this.animeRepo.getRanking(limit)
  }
}
