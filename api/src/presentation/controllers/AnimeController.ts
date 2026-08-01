import { Request, Response, NextFunction } from 'express'
import { container } from '../../infrastructure/container'
import { KitsuService } from '../../infrastructure/external/kitsu/KitsuService'
import { prisma } from '../../infrastructure/database/prisma/client'

const kitsuService = new KitsuService()

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
      let animesList: any[] = []
      if (Array.isArray(resultado)) {
        animesList = resultado
      } else if (resultado && (resultado as any).animes) {
        animesList = (resultado as any).animes
      }

      if (animesList && animesList.length > 0) {
        const ids = animesList.map(a => a.externalId)
        const dbAnimes = await prisma.anime.findMany({ where: { externalId: { in: ids as string[] } } })
        const dbMap = new Map(dbAnimes.map(a => [a.externalId, a.calificacionPromedio]))
        animesList.forEach(a => {
          if (dbMap.has(a.externalId)) {
            a.calificacionPromedio = Number(dbMap.get(a.externalId))
          }
        })
      }

      res.json(resultado)
    } catch (err) { next(err) }
  }

  detalle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params // Changed from externalId
      const resultado = await container.obtenerDetalleAnime.execute(String(externalId))
      res.json(resultado)
    } catch (err) { next(err) }
  }

  populares = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, perPage = 22, genero, anio } = req.query
      const resultado = await kitsuService.obtenerPopulares(
        Number(page), 
        Number(perPage),
        genero ? String(genero) : undefined,
        anio ? Number(anio) : undefined
      )
      
      // Enriquecer con notas MAL de la base de datos local
      if (resultado && resultado.length > 0) {
        const ids = resultado.map((a: any) => a.externalId)
        const dbAnimes = await prisma.anime.findMany({ where: { externalId: { in: ids as string[] } } })
        const dbMap = new Map(dbAnimes.map(a => [a.externalId, a.calificacionPromedio]))
        resultado.forEach((a: any) => {
          if (dbMap.has(a.externalId)) {
            a.calificacionPromedio = Number(dbMap.get(a.externalId))
          }
        })
      }

      res.json(resultado)
    } catch (err) { next(err) }
  }

  proxyImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: 'URL is required' });
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://anilist.co/',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });
      if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch image' });
      
      const contentType = response.headers.get('content-type');
      res.setHeader('Content-Type', contentType || 'image/jpeg');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err) {
      next(err);
    }
  }

  ranking = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ mensaje: 'Ranking desde base de datos local' })
    } catch (err) { next(err) }
  }

  personajes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { busqueda } = req.query
      if (!busqueda) return res.json([])
      const resultado = await kitsuService.buscarPersonajes(String(busqueda))
      res.json(resultado)
    } catch (err) { next(err) }
  }
}
