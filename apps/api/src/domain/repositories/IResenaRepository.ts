import { Resena } from '../entities/Resena'

export interface IResenaRepository {
  findById(id: string): Promise<Resena | null>
  findByUsuarioYAnime(usuarioId: string, animeId: string): Promise<Resena | null>
  findByAnime(animeId: string, page: number, limit: number): Promise<Resena[]>
  findByUsuario(usuarioId: string, page: number, limit: number): Promise<Resena[]>
  upsert(data: Partial<Resena>): Promise<Resena>
  delete(id: string, usuarioId: string): Promise<void>
  toggleLike(usuarioId: string, resenaId: string): Promise<{ accion: 'liked' | 'unliked' }>
}
