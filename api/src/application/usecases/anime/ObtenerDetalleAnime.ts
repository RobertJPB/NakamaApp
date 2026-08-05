import { IAnimeRepository } from '../../../domain/repositories/IAnimeRepository'
import { IResenaRepository } from '../../../domain/repositories/IResenaRepository'
import { IAnimeExternalService } from '../../interfaces/IAnimeExternalService'
import { AppError } from '../../../presentation/middlewares/error.middleware'
import { prisma } from '../../../infrastructure/database/prisma/client'

// Cache de resultados completos para evitar DB upsert + counts en cada petición
const resultCache = new Map<string, { data: any; ts: number }>()
const RESULT_CACHE_TTL = 60 * 60 * 1000 // 1 hora

export function invalidateDetalleAnimeCache(externalId: string) {
  resultCache.delete(`detalle_exec_${externalId}`)
}

export class ObtenerDetalleAnime {
  constructor(
    private readonly animeRepo: IAnimeRepository,
    private readonly animeService: IAnimeExternalService,
    private readonly resenaRepo: IResenaRepository,
  ) { }

  async execute(externalId: string) {
    // Devolver desde caché si está disponible (evita upsert + 4 queries de BD)
    const cacheKey = `detalle_exec_${externalId}`
    const cached = resultCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < RESULT_CACHE_TTL) {
      return cached.data
    }

    // Siempre hacemos el ciclo completo con Kitsu para obtener géneros y personajes actualizados
    // y traducidos. (KitsuService ya tiene su propia caché de 1 hora)
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

    const result = { anime, personajes }
    resultCache.set(cacheKey, { data: result, ts: Date.now() })
    return result
  }
}
