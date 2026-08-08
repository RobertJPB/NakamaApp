import { IComunidadRepository } from '../../../domain/repositories/IComunidadRepository'

export class BuscarComunidades {
  constructor(private readonly comunidadRepo: IComunidadRepository) {}
  async execute(q: string) {
    return this.comunidadRepo.buscar(q)
  }
}

export class ListarPublicacionesComunidadDirecto {
  constructor(private readonly comunidadRepo: IComunidadRepository) {}
  async execute(comunidadId: string, seccion?: string, page = 1, limit = 20, usuarioId?: string) {
    return this.comunidadRepo.listarPublicaciones(comunidadId, seccion, page, limit, usuarioId)
  }
}

export class CrearPublicacionComunidad {
  constructor(private readonly comunidadRepo: IComunidadRepository) {}
  async execute(dto: any) {
    return this.comunidadRepo.crearPublicacion(dto)
  }
}

export class EliminarPublicacionComunidad {
  constructor(private readonly comunidadRepo: IComunidadRepository) {}
  async execute(pubId: string, usuarioId: string) {
    await this.comunidadRepo.eliminarPublicacion(pubId, usuarioId)
  }
}

export class EditarPublicacionComunidad {
  constructor(private readonly comunidadRepo: IComunidadRepository) {}
  async execute(pubId: string, usuarioId: string, contenido: string) {
    return this.comunidadRepo.editarPublicacion(pubId, usuarioId, contenido)
  }
}

export class VotarEncuestaComunidad {
  constructor(private readonly comunidadRepo: IComunidadRepository) {}
  async execute(opcionId: string, usuarioId: string) {
    return this.comunidadRepo.votarEncuesta(opcionId, usuarioId)
  }
}

export class ListarMiembrosComunidad {
  constructor(private readonly comunidadRepo: IComunidadRepository) {}
  async execute(comunidadId: string) {
    return this.comunidadRepo.listarMiembros(comunidadId)
  }
}

export class ExpulsarMiembro {
  constructor(private readonly comunidadRepo: IComunidadRepository) {}
  async execute(comunidadId: string, objetivoId: string, adminId: string) {
    await this.comunidadRepo.expulsarMiembro(comunidadId, objetivoId, adminId)
  }
}

export class CambiarRolMiembro {
  constructor(private readonly comunidadRepo: IComunidadRepository) {}
  async execute(comunidadId: string, objetivoId: string, adminId: string, rol: string) {
    await this.comunidadRepo.cambiarRol(comunidadId, objetivoId, adminId, rol)
  }
}

export class ComentarPublicacionComunidad {
  constructor(private readonly comunidadRepo: IComunidadRepository) {}
  async execute(pubId: string, usuarioId: string, contenido: string) {
    return this.comunidadRepo.comentarPublicacion(pubId, usuarioId, contenido)
  }
}
