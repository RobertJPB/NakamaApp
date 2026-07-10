import { IUseCase }          from '../../interfaces/IUseCase'
import { IResenaRepository } from '../../../domain/repositories/IResenaRepository'
import { AppError }          from '../../../presentation/middlewares/error.middleware'

export interface ToggleLikeInput {
  usuarioId: string
  resenaId:  string
}

export class ToggleLikeResena implements IUseCase<ToggleLikeInput, any> {
  constructor(private readonly resenaRepo: IResenaRepository) {}

  async execute(input: ToggleLikeInput) {
    const resena = await this.resenaRepo.findById(input.resenaId)
    if (!resena) throw new AppError('Reseña no encontrada', 404)
    return this.resenaRepo.toggleLike(input.usuarioId, input.resenaId)
  }
}
