import { IListaRepository } from '../../../domain/repositories/IListaRepository'

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
    const actual = await this.listaRepo.findEntrada(dto.usuarioId, dto.animeId)
    let estados = actual?.estados ?? []
    
    if (estados.includes(dto.estado)) {
       estados = estados.filter(e => e !== dto.estado)
    } else {
       estados = [...estados, dto.estado]
    }

    return this.listaRepo.upsert({
      usuarioId:       dto.usuarioId,
      animeId:         dto.animeId,
      estados:         estados,
      episodiosVistos: dto.episodiosVistos ?? actual?.episodiosVistos ?? 0,
      esPrivada:       dto.esPrivada ?? actual?.esPrivada ?? false,
      notasPrivadas:   dto.notasPrivadas ?? actual?.notasPrivadas,
    })
  }
}
