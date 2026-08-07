import { IBibliotecaRepository } from '../../../domain/repositories/IBibliotecaRepository'

export class ObtenerListaBiblioteca {
  constructor(private readonly bibliotecaRepo: IBibliotecaRepository) {}
  async execute(targetUserId: string) {
    return this.bibliotecaRepo.obtenerLista(targetUserId)
  }
}

export class ObtenerColumnasBiblioteca {
  constructor(private readonly bibliotecaRepo: IBibliotecaRepository) {}
  async execute(targetUserId: string) {
    return this.bibliotecaRepo.obtenerColumnas(targetUserId)
  }
}

export class GuardarColumnaBiblioteca {
  constructor(private readonly bibliotecaRepo: IBibliotecaRepository) {}
  async execute(columnaId: string, usuarioId: string) {
    await this.bibliotecaRepo.guardarColumna(columnaId, usuarioId)
  }
}

export class QuitarColumnaGuardada {
  constructor(private readonly bibliotecaRepo: IBibliotecaRepository) {}
  async execute(columnaId: string, usuarioId: string) {
    await this.bibliotecaRepo.quitarColumnaGuardada(columnaId, usuarioId)
  }
}

export class GenerarInviteColumna {
  constructor(private readonly bibliotecaRepo: IBibliotecaRepository) {}
  async execute(columnaId: string, usuarioId: string) {
    return this.bibliotecaRepo.generarInvite(columnaId, usuarioId)
  }
}

export class AceptarInviteColumna {
  constructor(private readonly bibliotecaRepo: IBibliotecaRepository) {}
  async execute(columnaId: string, usuarioId: string) {
    await this.bibliotecaRepo.aceptarInvite(columnaId, usuarioId)
  }
}

export class CrearColumnaBiblioteca {
  constructor(private readonly bibliotecaRepo: IBibliotecaRepository) {}
  async execute(
    usuarioId: string,
    dto: { nombre: string; descripcion?: string; imagenUrl?: string }
  ) {
    return this.bibliotecaRepo.crearColumna(usuarioId, dto)
  }
}

export class ActualizarColumnaBiblioteca {
  constructor(private readonly bibliotecaRepo: IBibliotecaRepository) {}
  async execute(columnaId: string, usuarioId: string, dto: any) {
    return this.bibliotecaRepo.actualizarColumna(columnaId, usuarioId, dto)
  }
}

export class VerificarColaborador {
  constructor(private readonly bibliotecaRepo: IBibliotecaRepository) {}
  async execute(usuarioId: string, propietarioId: string, estado?: string) {
    await this.bibliotecaRepo.verificarColaborador(usuarioId, propietarioId, estado)
  }
}

export class ToggleFavoritoBiblioteca {
  constructor(private readonly bibliotecaRepo: IBibliotecaRepository) {}
  async execute(animeId: string, usuarioId: string) {
    return this.bibliotecaRepo.toggleFavorito(animeId, usuarioId)
  }
}
