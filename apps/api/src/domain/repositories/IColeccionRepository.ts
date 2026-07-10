import { Coleccion } from '../entities/Coleccion'

export interface IColeccionRepository {
  findById(id: string): Promise<Coleccion | null>
  findEditoriales(page: number, limit: number): Promise<Coleccion[]>
  findByUsuario(usuarioId: string): Promise<Coleccion[]>
  create(data: Partial<Coleccion>): Promise<Coleccion>
  update(id: string, data: Partial<Coleccion>): Promise<Coleccion>
  delete(id: string, usuarioId: string): Promise<void>
  agregarAnime(coleccionId: string, animeId: string, posicion: number, nota?: string): Promise<void>
  quitarAnime(coleccionId: string, animeId: string): Promise<void>
}
