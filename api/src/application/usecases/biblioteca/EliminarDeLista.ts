import { IUseCase }          from '../../interfaces/IUseCase'
import { IListaRepository }  from '../../../domain/repositories/IListaRepository'
import { AppError }          from '../../../presentation/middlewares/error.middleware'

export interface EliminarDeListaDTO {
  usuarioId: string
  animeId:   string
}

export class EliminarDeLista implements IUseCase<EliminarDeListaDTO, void> {
  constructor(private readonly listaRepo: IListaRepository) {}

  async execute(input: EliminarDeListaDTO): Promise<void> {
    const entrada = await this.listaRepo.findEntrada(input.usuarioId, input.animeId)
    if (!entrada) throw new AppError('El anime no está en tu lista', 404)
    await this.listaRepo.delete(input.usuarioId, input.animeId)
  }
}
