import { IListaRepository } from '../../../domain/repositories/IListaRepository'
import { EstadoLista } from '../../../domain/value-objects/EstadoLista'

export interface AgregarAListaDTO {
  usuarioId:       string
  animeId:         string
  estado:          string
  episodiosVistos?: number
  esPrivada?:      boolean
  notasPrivadas?:  string
}

export class AgregarALista {
  constructor(private readonly listaRepo: IListaRepository) {}

  async execute(dto: AgregarAListaDTO) {
    const estado = new EstadoLista(dto.estado)

    return this.listaRepo.upsert({
      usuarioId:       dto.usuarioId,
      animeId:         dto.animeId,
      estado:          estado.value,
      episodiosVistos: dto.episodiosVistos ?? 0,
      esPrivada:       dto.esPrivada ?? false,
      notasPrivadas:   dto.notasPrivadas,
    })
  }
}
