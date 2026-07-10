import { IAnimeRepository }       from '../../../domain/repositories/IAnimeRepository'
import { IAnimeExternalService }  from '../../interfaces/IAnimeExternalService'
import { AppError }               from '../../../presentation/middlewares/error.middleware'

export class ObtenerDetalleAnime {
  constructor(
    private readonly animeRepo:    IAnimeRepository,
    private readonly animeService: IAnimeExternalService,
  ) {}

  async execute(anilistId: number) {
    let anime = await this.animeRepo.findByAniListId(anilistId)

    if (!anime) {
      const { anime: datos, personajes } = await this.animeService.obtenerDetalle(anilistId)
      if (!datos) throw new AppError('Anime no encontrado', 404)
      anime = await this.animeRepo.upsert(datos)
      return { anime, personajes }
    }

    const { personajes } = await this.animeService.obtenerDetalle(anilistId)
    return { anime, personajes }
  }
}
