export interface EntradaLista {
  id:              string
  usuarioId:       string
  animeId:         string
  estados:         string[]
  episodiosVistos: number
  esFavorito:      boolean
  esPrivada:       boolean
  notasPrivadas?:  string
  actualizadoEn:   Date
  anime?:          any
}

export interface IListaRepository {
  findByUsuario(usuarioId: string, estado?: string): Promise<EntradaLista[]>
  findEntrada(usuarioId: string, animeId: string): Promise<EntradaLista | null>
  upsert(data: Partial<EntradaLista>): Promise<EntradaLista>
  delete(usuarioId: string, animeId: string): Promise<void>
  getStats(usuarioId: string): Promise<Record<string, number>>
  getParaRuleta(usuarioId: string): Promise<EntradaLista[]>
}
