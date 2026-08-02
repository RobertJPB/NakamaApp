import { IAnimeRepository } from '../../../domain/repositories/IAnimeRepository'
import { IResenaRepository } from '../../../domain/repositories/IResenaRepository'
import { IAnimeExternalService } from '../../interfaces/IAnimeExternalService'
import { AppError } from '../../../presentation/middlewares/error.middleware'
import { prisma } from '../../../infrastructure/database/prisma/client'

export class ObtenerDetalleAnime {
  constructor(
    private readonly animeRepo: IAnimeRepository,
    private readonly animeService: IAnimeExternalService,
    private readonly resenaRepo: IResenaRepository,
  ) { }

  async execute(externalId: string) {
    // Siempre hacemos el ciclo completo con Kitsu para obtener géneros y personajes actualizados
    // y traducidos.
    const animeLocal = await this.animeRepo.findByExternalId(externalId);
    const { anime: datos, personajes, generos } = await this.animeService.obtenerDetalle(externalId)
    if (!datos) throw new AppError('Anime no encontrado', 404)

    // Actualizamos siempre para guardar la traducción y limpieza
    const anime = await this.animeRepo.upsert(datos);
    (anime as any).generos = generos;

    // Usar la calificacion de la BD (actualizada por MAL) en lugar de la de Kitsu/Jikan en vivo
    // para que sea coherente con el ranking global
    if (animeLocal?.calificacionPromedio && Number(animeLocal.calificacionPromedio) > 0) {
      (anime as any).calificacionPromedio = Number(animeLocal.calificacionPromedio);
    } else if ((datos as any).calificacionPromedio) {
      (anime as any).calificacionPromedio = (datos as any).calificacionPromedio;
    }

    const [resenas, viendo, porVer, favoritos] = await Promise.all([
      this.resenaRepo.findByAnime(anime.id, 1, 10),
      prisma.listaUsuario.count({ where: { animeId: anime.id, estados: { has: 'Viendo' } } }),
      prisma.listaUsuario.count({ where: { animeId: anime.id, estados: { has: 'Por ver' } } }),
      prisma.listaUsuario.count({ where: { animeId: anime.id, estados: { has: 'Me gusta' } } })
    ]);

    (anime as any).resenas = resenas;
    (anime as any).stats = { viendo, porVer, favoritos };

    return { anime, personajes }
  }
}
