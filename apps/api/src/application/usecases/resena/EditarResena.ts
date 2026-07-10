import { IUseCase }          from '../../interfaces/IUseCase'
import { IResenaRepository } from '../../../domain/repositories/IResenaRepository'
import { Calificacion }      from '../../../domain/value-objects/Calificacion'
import { AppError }          from '../../../presentation/middlewares/error.middleware'

export interface EditarResenaInput {
  resenaId:         string
  usuarioId:        string
  calificacion?:    number
  contenido?:       string
  contieneSpoiler?: boolean
  esPublica?:       boolean
}

export class EditarResena implements IUseCase<EditarResenaInput, any> {
  constructor(private readonly resenaRepo: IResenaRepository) {}

  async execute(input: EditarResenaInput) {
    const resena = await this.resenaRepo.findById(input.resenaId)
    if (!resena)                        throw new AppError('Reseña no encontrada', 404)
    if (resena.usuarioId !== input.usuarioId) throw new AppError('No autorizado', 403)

    const calificacion = input.calificacion
      ? new Calificacion(input.calificacion).value
      : resena.calificacion

    return this.resenaRepo.upsert({
      ...resena,
      calificacion,
      contenido:       input.contenido       ?? resena.contenido,
      contieneSpoiler: input.contieneSpoiler ?? resena.contieneSpoiler,
      esPublica:       input.esPublica       ?? resena.esPublica,
    })
  }
}
