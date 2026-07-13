import { IUseCase }          from '../../interfaces/IUseCase'
import { IResenaRepository } from '../../../domain/repositories/IResenaRepository'
import { AppError }          from '../../../presentation/middlewares/error.middleware'

export interface EliminarResenaInput {
  resenaId:  string
  usuarioId: string
}

export class EliminarResena implements IUseCase<EliminarResenaInput, void> {
  constructor(private readonly resenaRepo: IResenaRepository) {}

  async execute(input: EliminarResenaInput): Promise<void> {
    const resena = await this.resenaRepo.findById(input.resenaId)
    if (!resena)                              throw new AppError('Reseña no encontrada', 404)
    if (resena.usuarioId !== input.usuarioId) throw new AppError('No autorizado', 403)
    await this.resenaRepo.delete(input.resenaId, input.usuarioId)
  }
}
