import { Usuario } from '../entities/Usuario'

export interface IUsuarioRepository {
  findById(id: string): Promise<Usuario | null>
  findByUsername(username: string): Promise<Usuario | null>
  create(data: Partial<Usuario>): Promise<Usuario>
  update(id: string, data: Partial<Usuario>): Promise<Usuario>
  delete(id: string): Promise<void>
  getSeguidores(usuarioId: string): Promise<Usuario[]>
  getSiguiendo(usuarioId: string): Promise<Usuario[]>
  toggleSeguir(seguidorId: string, seguidoId: string): Promise<{ accion: 'seguido' | 'dejado' | 'pendiente' }>

  findByIdRaw(id: string): Promise<any | null>
  findPerfilPorUsername(username: string): Promise<any | null>
  obtenerEstadoSeguimiento(seguidorId: string, seguidoId: string): Promise<string | undefined>
  findSeguidores(id: string): Promise<any[]>
  findSiguiendo(id: string): Promise<any[]>
  buscarUsuarios(q: string): Promise<any[]>
  findSeguidoIds(seguidorId: string): Promise<string[]>
  findSugeridos(excludedIds: string[], take: number): Promise<any[]>
  findActividad(usuarioId: string, viewerId: string | undefined, page: number, limit: number): Promise<{ publicaciones: any[]; resenas: any[] }>
}
