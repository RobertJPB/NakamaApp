import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository'
import { AppError } from '../../../presentation/middlewares/error.middleware'

export interface ObtenerFeedDTO {
  usuarioId: string
  page?:     number
  limit?:    number
}

export class ObtenerFeed {
  constructor(private readonly usuarioRepo: IUsuarioRepository) {}

  async execute(dto: ObtenerFeedDTO) {
    const page = dto.page ?? 1
    const limit = dto.limit ?? 20
    const usuario = await this.usuarioRepo.findById(dto.usuarioId)
    if (!usuario) throw new AppError('Usuario no encontrado', 404)
    return { usuarioId: dto.usuarioId, page, limit }
  }
}
