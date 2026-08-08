import { Comunidad } from '../entities/Comunidad'

export interface IComunidadRepository {
  findById(id: string): Promise<Comunidad | null>
  findMany(tipo?: string, page?: number, limit?: number): Promise<Comunidad[]>
  create(data: Partial<Comunidad>): Promise<Comunidad>
  update(id: string, data: Partial<Comunidad>): Promise<Comunidad>
  delete(id: string): Promise<void>
  unirse(usuarioId: string, comunidadId: string): Promise<void>
  salir(usuarioId: string, comunidadId: string): Promise<void>
  esMiembro(usuarioId: string, comunidadId: string): Promise<boolean>

  buscar(q: string): Promise<any[]>
  listarPublicaciones(
    comunidadId: string,
    seccion?: string,
    page?: number,
    limit?: number,
    usuarioId?: string
  ): Promise<any[]>
  crearPublicacion(dto: any): Promise<any>
  eliminarPublicacion(pubId: string, usuarioId: string): Promise<void>
  editarPublicacion(pubId: string, usuarioId: string, contenido: string): Promise<any>
  votarEncuesta(opcionId: string, usuarioId: string): Promise<{ accion: string }>
  listarMiembros(comunidadId: string): Promise<any[]>
  expulsarMiembro(comunidadId: string, objetivoId: string, adminId: string): Promise<void>
  cambiarRol(comunidadId: string, objetivoId: string, adminId: string, rol: string): Promise<void>
  comentarPublicacion(pubId: string, usuarioId: string, contenido: string): Promise<any>
}
