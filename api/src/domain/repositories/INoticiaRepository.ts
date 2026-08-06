export interface INoticiaRepository {
  getRecientes(limit: number): Promise<any[]>
  getPopulares(): Promise<any[]>
}
