import { Request, Response, NextFunction } from 'express'
import { container } from '../../infrastructure/container'
import { obtenerImagenProtegida } from '../../infrastructure/services/imageProxy'

export class AnimeController {
  buscar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { busqueda, genero, demografia, temporada, anio, tipo, page = 1 } = req.query
      const resultado = await container.buscarAnimes.execute(
        {
          busqueda: busqueda as string,
          genero: genero as string,
          demografia: demografia as string,
          temporada: temporada as string,
          anio: anio ? Number(anio) : undefined,
          tipo: tipo as string,
        },
        Number(page)
      )

      // Enriquecer con notas MAL de la base de datos local
      let animesList: any[] = []
      if (Array.isArray(resultado)) {
        animesList = resultado
      } else if (resultado && (resultado as any).animes) {
        animesList = (resultado as any).animes
      }

      if (animesList && animesList.length > 0) {
        await container.animeRepo.enriquecerConCalificaciones(animesList)
      }

      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }

  detalle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params // Changed from externalId
      const resultado = await container.obtenerDetalleAnime.execute(String(externalId))
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }

  populares = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, perPage = 22, genero, anio, tipo, demografia, temporada } = req.query
      const resultado = await container.animeService.obtenerPopulares(
        Number(page),
        Number(perPage),
        genero ? String(genero) : undefined,
        anio ? Number(anio) : undefined,
        tipo ? String(tipo) : undefined,
        demografia ? String(demografia) : undefined,
        temporada ? String(temporada) : undefined
      )

      // Enriquecer con notas MAL de la base de datos local
      if (resultado && resultado.length > 0) {
        await container.animeRepo.enriquecerConCalificaciones(resultado)
      }

      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }

  proxyImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const url = req.query.url as string
      if (!url) return res.status(400).json({ error: 'URL es requerida' })

      const { buffer, contentType } = await obtenerImagenProtegida(url)

      res.setHeader('Content-Type', contentType || 'image/jpeg')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 'public, max-age=31536000')
      res.send(buffer)
    } catch (err) {
      next(err)
    }
  }

  personajes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { busqueda } = req.query
      if (!busqueda) return res.json([])
      const resultado = await container.animeService.buscarPersonajes(String(busqueda))
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }
}
