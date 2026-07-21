import { Request, Response, NextFunction } from 'express'
import { container } from '../../infrastructure/container'
import { AniListService } from '../../infrastructure/services/AniListService'
import { prisma } from '../../infrastructure/database/prisma/client'

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

      // Enriquecer con notas MAL de la base de datos local
      if (resultado.animes && resultado.animes.length > 0) {
        const ids = resultado.animes.map(a => a.anilistId)
        const dbAnimes = await prisma.anime.findMany({ where: { anilistId: { in: ids as number[] } } })
        const dbMap = new Map(dbAnimes.map(a => [a.anilistId, a.calificacionPromedio]))
        resultado.animes.forEach(a => {
          if (dbMap.has(a.anilistId)) {
            a.calificacionPromedio = Number(dbMap.get(a.anilistId))
          }
        })
      }

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
      const { page = 1, perPage = 18, genero, anio } = req.query
      const resultado = await aniListService.obtenerPopulares(
        Number(page), 
        Number(perPage),
        genero ? String(genero) : undefined,
        anio ? Number(anio) : undefined
      )

      // Enriquecer con notas MAL de la base de datos local
      if (resultado && resultado.length > 0) {
        const ids = resultado.map(a => a.anilistId)
        const dbAnimes = await prisma.anime.findMany({ where: { anilistId: { in: ids as number[] } } })
        const dbMap = new Map(dbAnimes.map(a => [a.anilistId, a.calificacionPromedio]))
        resultado.forEach(a => {
          if (dbMap.has(a.anilistId)) {
            a.calificacionPromedio = Number(dbMap.get(a.anilistId))
          }
        })
      }

      res.json(resultado)
    } catch (err) { next(err) }
  }

  ranking = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ mensaje: 'Ranking desde base de datos local' })
    } catch (err) { next(err) }
  }
}
