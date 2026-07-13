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
}
