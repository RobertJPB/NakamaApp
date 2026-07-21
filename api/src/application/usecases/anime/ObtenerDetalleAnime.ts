import { IAnimeRepository }       from '../../../domain/repositories/IAnimeRepository'
import { IResenaRepository }      from '../../../domain/repositories/IResenaRepository'
import { IAnimeExternalService }  from '../../interfaces/IAnimeExternalService'
import { AppError }               from '../../../presentation/middlewares/error.middleware'
import { prisma }                 from '../../../infrastructure/database/prisma/client'

export class ObtenerDetalleAnime {
  constructor(
    private readonly animeRepo:    IAnimeRepository,
    private readonly animeService: IAnimeExternalService,
    private readonly resenaRepo:   IResenaRepository,
  ) {}

  async execute(anilistId: number) {
    const { anime: datos, personajes, generos } = await this.animeService.obtenerDetalle(anilistId)
    if (!datos) throw new AppError('Anime no encontrado', 404)
    
    // Actualizamos siempre para guardar la traducción y limpieza
    const anime = await this.animeRepo.upsert(datos);
    (anime as any).generos = generos;

    const resenas = await this.resenaRepo.findByAnime(anime.id, 1, 10);
    (anime as any).resenas = resenas;

    const viendo = await prisma.listaUsuario.count({
      where: { animeId: anime.id, estados: { has: 'Viendo' } }
    })
    const porVer = await prisma.listaUsuario.count({
      where: { animeId: anime.id, estados: { has: 'Por ver' } }
    })
    const favoritos = await prisma.listaUsuario.count({
      where: { animeId: anime.id, estados: { has: 'Me gusta' } }
    })

    ;(anime as any).stats = { viendo, porVer, favoritos };

    return { anime, personajes }
  }
}
