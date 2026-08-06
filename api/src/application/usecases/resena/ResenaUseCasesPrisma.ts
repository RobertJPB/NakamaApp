import { IResenaRepository } from '../../../domain/repositories/IResenaRepository'

export class ObtenerResenasRecientes {
  constructor(private readonly resenaRepo: IResenaRepository) {}
  async execute(limit: number) {
    return this.resenaRepo.findRecientes(limit)
  }
}

export class BuscarResenas {
  constructor(private readonly resenaRepo: IResenaRepository) {}
  async execute(q: string) {
    return this.resenaRepo.buscar(q)
  }
}

export class ObtenerResenasPorAnime {
  constructor(private readonly resenaRepo: IResenaRepository) {}
  async execute(animeId: string, page: number, limit: number) {
    return this.resenaRepo.findByAnimePaginado(animeId, page, limit)
  }
}

export class ObtenerResenasPorUsuario {
  constructor(private readonly resenaRepo: IResenaRepository) {}
  async execute(usuarioId: string) {
    return this.resenaRepo.findByUsuarioPublicas(usuarioId)
  }
}
