import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository'
import { AppError } from '../../../presentation/middlewares/error.middleware'

export interface ToggleSeguirDTO {
  seguidorId: string
  seguidoId: string
}

export class ToggleSeguir {
  constructor(private readonly usuarioRepo: IUsuarioRepository) {}

  async execute(dto: ToggleSeguirDTO) {
    if (dto.seguidorId === dto.seguidoId) {
      throw new AppError('No puedes seguirte a ti mismo', 400)
    }

    const usuarioObjetivo = await this.usuarioRepo.findById(dto.seguidoId)
    if (!usuarioObjetivo) throw new AppError('Usuario no encontrado', 404)

    return this.usuarioRepo.toggleSeguir(dto.seguidorId, dto.seguidoId)
  }
}
