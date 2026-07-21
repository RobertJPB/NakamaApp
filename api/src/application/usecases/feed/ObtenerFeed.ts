import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository'
import { IResenaRepository }  from '../../../domain/repositories/IResenaRepository'
import { AppError }           from '../../../presentation/middlewares/error.middleware'

export interface ObtenerFeedDTO {
  usuarioId: string
  page?:     number
  limit?:    number
}

export class ObtenerFeed {
  constructor(
    private readonly usuarioRepo: IUsuarioRepository,
    private readonly resenaRepo:  IResenaRepository
  ) {}

  async execute(dto: ObtenerFeedDTO) {
    const page = dto.page ?? 1
    const limit = dto.limit ?? 20
    const usuario = await this.usuarioRepo.findById(dto.usuarioId)
    if (!usuario) throw new AppError('Usuario no encontrado', 404)
    
    const feed = await this.resenaRepo.findFeedByUsuario(dto.usuarioId, page, limit)
    return feed
  }
}
