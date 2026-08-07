import { IUseCase } from '../../interfaces/IUseCase'
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository'
import { AppError } from '../../../presentation/middlewares/error.middleware'

export interface ActualizarPerfilDTO {
  usuarioId: string
  username?: string
  nombreDisplay?: string
  bio?: string
  sitioWeb?: string
  avatarUrl?: string
  bannerUrl?: string
  marcoUrl?: string
  perfilPrivado?: boolean
  resenasPublicas?: boolean
  listasPublicas?: boolean
}

export class ActualizarPerfil implements IUseCase<ActualizarPerfilDTO, any> {
  constructor(private readonly usuarioRepo: IUsuarioRepository) {}

  async execute(input: ActualizarPerfilDTO) {
    const usuario = await this.usuarioRepo.findById(input.usuarioId)
    if (!usuario) throw new AppError('Usuario no encontrado', 404)

    if (input.username && input.username !== usuario.username) {
      const existing = await this.usuarioRepo.findByUsername(input.username)
      if (existing) {
        throw new AppError('El username ya está en uso', 400)
      }
    }

    const { usuarioId, ...campos } = input
    return this.usuarioRepo.update(usuarioId, campos)
  }
}
