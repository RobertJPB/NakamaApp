import { Request, Response, NextFunction } from 'express'
import { container } from '../../infrastructure/container'
import { AniListService } from '../../infrastructure/services/AniListService'

const aniListService = new AniListService()

export class AnimeController {
  buscar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { busqueda, genero, demografia, temporada, anio, tipo, page = 1 } = req.query
      const resultado = await container.buscarAnimes.execute({
        busqueda: busqueda as string,
        genero: genero as string,
        demografia: demografia as string,
        temporada: temporada as string,
        anio: anio ? Number(anio) : undefined,
        tipo: tipo as string
      }, Number(page))
      res.json(resultado)
    } catch (err) { next(err) }
  }

  detalle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { anilistId } = req.params
      const resultado = await container.obtenerDetalleAnime.execute(Number(anilistId))
      res.json(resultado)
    } catch (err) { next(err) }
  }

  populares = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1 } = req.query
      const resultado = await aniListService.obtenerPopulares(Number(page))
      res.json(resultado)
    } catch (err) { next(err) }
  }

  ranking = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ mensaje: 'Ranking desde base de datos local' })
    } catch (err) { next(err) }
  }
}
