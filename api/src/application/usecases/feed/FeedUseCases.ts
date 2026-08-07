import { IFeedRepository } from '../../../domain/repositories/IFeedRepository'

export class CrearPublicacionFeed {
  constructor(private readonly feedRepo: IFeedRepository) {}
  async execute(dto: {
    usuarioId: string
    contenido?: string
    tema?: string
    soloAmigos?: boolean
    tipo?: string
    opciones?: string[]
    imagenUrl?: string
  }) {
    return this.feedRepo.crearPublicacion(dto)
  }
}

export class EliminarPublicacionFeed {
  constructor(private readonly feedRepo: IFeedRepository) {}
  async execute(id: string, usuarioId: string) {
    await this.feedRepo.eliminarPublicacion(id, usuarioId)
  }
}

export class EliminarFeedResena {
  constructor(private readonly feedRepo: IFeedRepository) {}
  async execute(referenciaId: string, usuarioId: string) {
    await this.feedRepo.eliminarFeedResena(referenciaId, usuarioId)
  }
}

export class ToggleLikePublicacion {
  constructor(private readonly feedRepo: IFeedRepository) {}
  async execute(id: string, usuarioId: string) {
    return this.feedRepo.toggleLike(id, usuarioId)
  }
}

export class ObtenerComentarios {
  constructor(private readonly feedRepo: IFeedRepository) {}
  async execute(tipo: string, id: string) {
    return this.feedRepo.obtenerComentarios(tipo, id)
  }
}

export class CrearComentario {
  constructor(private readonly feedRepo: IFeedRepository) {}
  async execute(dto: {
    tipo: string
    id: string
    usuarioId: string
    contenido: string
    padreId?: string
  }) {
    return this.feedRepo.crearComentario(dto)
  }
}

export class EliminarComentario {
  constructor(private readonly feedRepo: IFeedRepository) {}
  async execute(tipo: string, id: string, comentarioId: string, usuarioId: string) {
    await this.feedRepo.eliminarComentario(tipo, id, comentarioId, usuarioId)
  }
}
