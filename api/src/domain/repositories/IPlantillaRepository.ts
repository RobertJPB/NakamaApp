export interface IPlantillaRepository {
  listar(): Promise<any[]>
  crear(dto: { nombre: string; datos: unknown; usuarioId: string }): Promise<any>
}
