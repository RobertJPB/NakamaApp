import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository'
import { Username } from '../../../domain/value-objects/Username'
import { AppError } from '../../../presentation/middlewares/error.middleware'

export interface RegistrarUsuarioDTO {
  id:       string
  email:    string
  username: string
  nombre:   string
}

export class RegistrarUsuario {
  constructor(private readonly usuarioRepo: IUsuarioRepository) {}

  async execute(dto: RegistrarUsuarioDTO) {
    const username = new Username(dto.username)

    const existente = await this.usuarioRepo.findByUsername(username.value)
    if (existente) throw new AppError('El username ya está en uso', 409)

    return this.usuarioRepo.create({
      id:            dto.id,
      email:         dto.email,
      username:      username.value,
      nombreDisplay: dto.nombre,
    })
  }
}
