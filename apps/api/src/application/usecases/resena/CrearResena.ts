import { IUseCase }           from '../../interfaces/IUseCase'
import { IResenaRepository }  from '../../../domain/repositories/IResenaRepository'
import { Calificacion }       from '../../../domain/value-objects/Calificacion'
import { AppError }           from '../../../presentation/middlewares/error.middleware'

// SRP: solo crea reseñas, nada más
// OCP: extender comportamiento sin modificar esta clase

export interface CrearResenaInput {
  usuarioId:        string
  animeId:          string
  calificacion:     number
  contenido?:       string
  contieneSpoiler:  boolean
  esPublica:        boolean
}

export class CrearResena implements IUseCase<CrearResenaInput, any> {
  // DIP: depende de abstracción, no de implementación concreta
  constructor(private readonly resenaRepo: IResenaRepository) {}

  async execute(input: CrearResenaInput) {
    const calificacion = new Calificacion(input.calificacion)

    const existente = await this.resenaRepo.findByUsuarioYAnime(
      input.usuarioId,
      input.animeId
    )
    if (existente) throw new AppError('Ya tienes una reseña para este anime', 409)

    return this.resenaRepo.upsert({
      usuarioId:       input.usuarioId,
      animeId:         input.animeId,
      calificacion:    calificacion.value,
      contenido:       input.contenido,
      contieneSpoiler: input.contieneSpoiler,
      esPublica:       input.esPublica,
    })
  }
}
