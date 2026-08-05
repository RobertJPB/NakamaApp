import { IUseCase }           from '../../interfaces/IUseCase'
import { IResenaRepository }  from '../../../domain/repositories/IResenaRepository'
import { Calificacion }       from '../../../domain/value-objects/Calificacion'
import { AppError }           from '../../../presentation/middlewares/error.middleware'
import { invalidateDetalleAnimeCache } from '../anime/ObtenerDetalleAnime'

export interface CrearResenaInput {
  usuarioId:        string
  animeId:          string
  calificacion:     number
  contenido?:       string
  contieneSpoiler:  boolean
  esPublica:        boolean
  fechaVisto?:      Date | string
  etiquetas?:       string[]
}

export class CrearResena implements IUseCase<CrearResenaInput, any> {
  constructor(private readonly resenaRepo: IResenaRepository) {}

  async execute(input: CrearResenaInput) {
    const calificacion = new Calificacion(input.calificacion)

    const existente = await this.resenaRepo.findByUsuarioYAnime(
      input.usuarioId,
      input.animeId
    )
    if (existente) throw new AppError('Ya tienes una reseña para este anime', 409)

    const result = await this.resenaRepo.upsert({
      usuarioId:       input.usuarioId,
      animeId:         input.animeId,
      calificacion:    calificacion.value,
      contenido:       input.contenido,
      contieneSpoiler: input.contieneSpoiler,
      esPublica:       input.esPublica,
      fechaVisto:      input.fechaVisto ? new Date(input.fechaVisto) : undefined,
      etiquetas:       input.etiquetas ?? [],
    })
    
    // Invalidate the cache for this anime so the new review appears immediately
    invalidateDetalleAnimeCache(input.animeId)
    
    return result
  }
}
