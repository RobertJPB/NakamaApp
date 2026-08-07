export interface IFeedRepository {
  crearPublicacion(dto: {
    usuarioId: string
    contenido?: string
    tema?: string
    soloAmigos?: boolean
    tipo?: string
    opciones?: string[]
    imagenUrl?: string
  }): Promise<any>
  eliminarPublicacion(id: string, usuarioId: string): Promise<void>
  eliminarFeedResena(referenciaId: string, usuarioId: string): Promise<void>
  toggleLike(id: string, usuarioId: string): Promise<{ accion: 'liked' | 'unliked' }>
  obtenerComentarios(tipo: string, id: string): Promise<any[]>
  crearComentario(dto: {
    tipo: string
    id: string
    usuarioId: string
    contenido: string
    padreId?: string
  }): Promise<any>
  eliminarComentario(
    tipo: string,
    id: string,
    comentarioId: string,
    usuarioId: string
  ): Promise<void>
}
