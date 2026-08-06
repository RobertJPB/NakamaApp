import { IColeccionRepository } from '../../../domain/repositories/IColeccionRepository'

export class BuscarColecciones {
  constructor(private readonly coleccionRepo: IColeccionRepository) {}

  async execute(query: string) {
    return this.coleccionRepo.buscar(query)
  }
}
