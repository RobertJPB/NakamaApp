import { IUseCase }            from '../../interfaces/IUseCase'
import { IUsuarioRepository }  from '../../../domain/repositories/IUsuarioRepository'
import { AppError }            from '../../../presentation/middlewares/error.middleware'

export interface ActualizarPerfilDTO {
  usuarioId:      string
  nombreDisplay?: string
  bio?:           string
  sitioWeb?:      string
  avatarUrl?:     string
  bannerUrl?:     string
  perfilPrivado?: boolean
  resenasPublicas?: boolean
  listasPublicas?:  boolean
}

export class ActualizarPerfil implements IUseCase<ActualizarPerfilDTO, any> {
  constructor(private readonly usuarioRepo: IUsuarioRepository) {}

  async execute(input: ActualizarPerfilDTO) {
    const usuario = await this.usuarioRepo.findById(input.usuarioId)
    if (!usuario) throw new AppError('Usuario no encontrado', 404)

    const { usuarioId, ...campos } = input
    return this.usuarioRepo.update(usuarioId, campos)
  }
}
