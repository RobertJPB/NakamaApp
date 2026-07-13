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
}
