import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository'
import { IResenaRepository } from '../../../domain/repositories/IResenaRepository'
import { AppError } from '../../../presentation/middlewares/error.middleware'

export interface ObtenerFeedDTO {
  usuarioId: string
  cursor?: string | null
  limit?: number
}

export class ObtenerFeed {
  constructor(
    private readonly usuarioRepo: IUsuarioRepository,
    private readonly resenaRepo: IResenaRepository
  ) {}

  async execute(dto: ObtenerFeedDTO) {
    const limit = dto.limit ?? 20
    const cursor = dto.cursor ?? null
    const usuario = await this.usuarioRepo.findById(dto.usuarioId)
    if (!usuario) throw new AppError('Usuario no encontrado', 404)

    const feed = await this.resenaRepo.findFeedByUsuario(dto.usuarioId, cursor, limit)
    return feed
  }
}
