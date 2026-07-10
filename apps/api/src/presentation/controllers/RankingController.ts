import { Request, Response, NextFunction } from 'express'
import { container } from '../../infrastructure/container'

export class RankingController {
  global = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50
      const resultado = await container.obtenerRanking.execute({ tipo: 'global', limit })
      res.json(resultado)
    } catch (err) { next(err) }
  }

  temporada = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const resultado = await container.obtenerRanking.execute({ tipo: 'temporada' })
      res.json(resultado)
    } catch (err) { next(err) }
  }
}
