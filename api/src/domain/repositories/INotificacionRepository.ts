export interface INotificacionRepository {
  listar(usuarioId: string): Promise<any[]>
  marcarTodasLeidas(usuarioId: string): Promise<void>
  marcarLeida(id: string, usuarioId: string): Promise<void>
}
