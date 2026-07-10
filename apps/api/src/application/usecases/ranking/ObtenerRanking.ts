import { IAnimeRepository } from '../../../domain/repositories/IAnimeRepository'

export interface ObtenerRankingDTO {
  tipo?: 'global' | 'temporada'
  limit?: number
}

export class ObtenerRanking {
  constructor(private readonly animeRepo: IAnimeRepository) {}

  async execute(dto: ObtenerRankingDTO) {
    const tipo = dto.tipo ?? 'global'
    const limit = dto.limit ?? 50
    if (tipo === 'temporada') return this.animeRepo.getRankingTemporada()
    return this.animeRepo.getRanking(limit)
  }
}
