import { EstadoListaType } from '../value-objects/EstadoLista'

export interface EntradaLista {
  id:              string
  usuarioId:       string
  animeId:         string
  estado:          EstadoListaType
  episodiosVistos: number
  esFavorito:      boolean
  esPrivada:       boolean
  notasPrivadas?:  string
  actualizadoEn:   Date
}

export interface IListaRepository {
  findByUsuario(usuarioId: string, estado?: EstadoListaType): Promise<EntradaLista[]>
  findEntrada(usuarioId: string, animeId: string): Promise<EntradaLista | null>
  upsert(data: Partial<EntradaLista>): Promise<EntradaLista>
  delete(usuarioId: string, animeId: string): Promise<void>
  getStats(usuarioId: string): Promise<Record<EstadoListaType, number>>
  getParaRuleta(usuarioId: string): Promise<EntradaLista[]>
}
