import { IAnimeRepository } from '../../../domain/repositories/IAnimeRepository'
import { IResenaRepository } from '../../../domain/repositories/IResenaRepository'
import { IAnimeExternalService } from '../../interfaces/IAnimeExternalService'
import { AppError } from '../../../presentation/middlewares/error.middleware'
import { PrismaClient } from '@prisma/client'
import { crearCacheAcotada } from '../../../infrastructure/services/boundedCache'

// Cache de resultados completos para evitar DB upsert + counts en cada petición
const RESULT_CACHE_TTL = 60 * 60 * 1000 // 1 hora
const resultCache = crearCacheAcotada<string, any>(200, RESULT_CACHE_TTL)

export function invalidateDetalleAnimeCache(externalId: string) {
  resultCache.delete(`detalle_exec_${externalId}`)
}

export class ObtenerDetalleAnime {
  constructor(
    private readonly animeRepo: IAnimeRepository,
    private readonly animeService: IAnimeExternalService,
    private readonly resenaRepo: IResenaRepository,
    private readonly prisma: PrismaClient,
  ) { }

  async execute(externalId: string) {
    // Devolver desde caché si está disponible (evita upsert + 4 queries de BD)
    const cacheKey = `detalle_exec_${externalId}`
    const cached = resultCache.get(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    // Siempre hacemos el ciclo completo con Kitsu para obtener géneros y personajes actualizados
    // y traducidos. (KitsuService ya tiene su propia caché de 1 hora)
    const animeLocal = await this.animeRepo.findByExternalId(externalId);
    const { anime: datos, personajes, generos } = await this.animeService.obtenerDetalle(externalId)
    if (!datos) throw new AppError('Anime no encontrado', 404)

    // Si la traducción en vivo falló, usamos la sinopsis local si existe (para no sobrescribir español con inglés).
    // Ojo: no usar sinopsis locales corruptas (p.ej. error "QUERY LENGTH LIMIT" de MyMemory guardado en la DB).
    const localSinopsisValida = animeLocal?.sinopsis && !/QUERY LENGTH/i.test(animeLocal.sinopsis)
      ? animeLocal.sinopsis
      : null;
    if ((datos as any).traducido === false && localSinopsisValida) {
      datos.sinopsis = localSinopsisValida;
    }

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
      this.prisma.listaUsuario.count({ where: { animeId: anime.id, estados: { has: 'Viendo' } } }),
      this.prisma.listaUsuario.count({ where: { animeId: anime.id, estados: { has: 'Por ver' } } }),
      this.prisma.listaUsuario.count({ where: { animeId: anime.id, estados: { has: 'Me gusta' } } })
    ]);

    (anime as any).resenas = resenas;
    (anime as any).stats = { viendo, porVer, favoritos };

    const result = { anime, personajes }
    resultCache.set(cacheKey, result)
    return result
  }
}
