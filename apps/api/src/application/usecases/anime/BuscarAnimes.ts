import { IAnimeRepository, AnimeFilters } from '../../../domain/repositories/IAnimeRepository'
import { IAnimeExternalService }           from '../../interfaces/IAnimeExternalService'

export class BuscarAnimes {
  constructor(
    private readonly animeRepo:    IAnimeRepository,
    private readonly animeService: IAnimeExternalService,
  ) {}

  async execute(filters: AnimeFilters, page = 1, limit = 20) {
    if (filters.busqueda) {
      return this.animeService.buscarAnimes(filters.busqueda, page)
    }
    return this.animeRepo.findMany(filters, page, limit)
  }
}
