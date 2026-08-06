import { INotificacionRepository } from '../../../domain/repositories/INotificacionRepository'

export class ListarNotificaciones {
  constructor(private readonly notificacionRepo: INotificacionRepository) {}
  async execute(usuarioId: string) {
    return this.notificacionRepo.listar(usuarioId)
  }
}

export class MarcarTodasLeidas {
  constructor(private readonly notificacionRepo: INotificacionRepository) {}
  async execute(usuarioId: string) {
    await this.notificacionRepo.marcarTodasLeidas(usuarioId)
  }
}

export class MarcarLeida {
  constructor(private readonly notificacionRepo: INotificacionRepository) {}
  async execute(id: string, usuarioId: string) {
    await this.notificacionRepo.marcarLeida(id, usuarioId)
  }
}
