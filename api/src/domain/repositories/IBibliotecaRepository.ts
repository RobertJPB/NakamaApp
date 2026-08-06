export interface IBibliotecaRepository {
  obtenerLista(targetUserId: string): Promise<{ usuarioId: string; lista: any[] }>
  obtenerColumnas(targetUserId: string): Promise<{ usuarioId: string; columnas: any[] }>
  guardarColumna(columnaId: string, usuarioId: string): Promise<void>
  quitarColumnaGuardada(columnaId: string, usuarioId: string): Promise<void>
  generarInvite(columnaId: string, usuarioId: string): Promise<string>
  aceptarInvite(columnaId: string, usuarioId: string): Promise<void>
  crearColumna(usuarioId: string, dto: { nombre: string; descripcion?: string; imagenUrl?: string }): Promise<any>
  actualizarColumna(columnaId: string, usuarioId: string, dto: any): Promise<any>
  verificarColaborador(usuarioId: string, propietarioId: string, estado?: string): Promise<void>
  toggleFavorito(animeId: string, usuarioId: string): Promise<{ mensaje: string; esFavorito: boolean }>
}
