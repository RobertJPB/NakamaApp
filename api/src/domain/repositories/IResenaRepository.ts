import { Resena } from '../entities/Resena'

export interface IResenaRepository {
  findById(id: string): Promise<Resena | null>
  findByUsuarioYAnime(usuarioId: string, animeId: string): Promise<Resena | null>
  findByAnime(animeId: string, page: number, limit: number): Promise<Resena[]>
  findByUsuario(usuarioId: string, page: number, limit: number): Promise<Resena[]>
  upsert(data: Partial<Resena>): Promise<Resena>
  delete(id: string, usuarioId: string): Promise<void>
  toggleLike(usuarioId: string, resenaId: string): Promise<{ accion: 'liked' | 'unliked' }>
  findFeedByUsuario(usuarioId: string, cursor: string | null, limit: number): Promise<any[]>

  findRecientes(limit: number): Promise<any[]>
  buscar(q: string): Promise<any[]>
  findByAnimePaginado(
    animeId: string,
    page: number,
    limit: number
  ): Promise<{ animeId: string; page: number; limit: number; resenas: any[] }>
  findByUsuarioPublicas(usuarioId: string): Promise<{ usuarioId: string; resenas: any[] }>
}
