import { Request, Response, NextFunction } from 'express'
import { INoticiaRepository } from '../../domain/repositories/INoticiaRepository'
import { obtenerImagenProtegida } from '../../infrastructure/services/imageProxy'

export class NoticiasController {
  constructor(private readonly noticiaRepo: INoticiaRepository) {}

  async getNoticias(req: Request, res: Response) {
    try {
      const { limit = 6 } = req.query

      const noticias = await this.noticiaRepo.getRecientes(Number(limit))

      res.json(noticias)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Error al obtener noticias' })
    }
  }

  async getPopular(req: Request, res: Response) {
    try {
      const noticias = await this.noticiaRepo.getPopulares()

      if (noticias.length > 0) {
        return res.json(noticias)
      }

      // Fallback editorial mientras no haya noticias recolectadas en la BD
      const popularNews = [
        {
          id: 'pop-1',
          titulo: 'Hanako-kun, el fantasma del lavabo volverá de su pausa en agosto',
          resumen: 'El manga regresará con un nuevo capítulo este próximo mes.',
          urlOrigen: 'https://ramenparados.com/',
          imagenUrl:
            'https://ramenparados.com/wp-content/uploads/2026/07/hanako-kun-destacado-alter.jpg',
          fuente: 'RamenParaDos',
          fechaPublicacion: new Date('2026-07-14T00:00:00Z'),
        },
        {
          id: 'pop-2',
          titulo: 'La segunda temporada de Ao Ashi llegará a Crunchyroll',
          resumen:
            'Crunchyroll confirma el simulcast de la esperada continuación del anime de fútbol.',
          urlOrigen: 'https://ramenparados.com/',
          imagenUrl:
            'https://ramenparados.com/wp-content/uploads/2026/07/AoAshi_Season2_Portada.webp',
          fuente: 'RamenParaDos',
          fechaPublicacion: new Date('2026-07-10T00:00:00Z'),
        },
        {
          id: 'pop-3',
          titulo: 'Lanzamientos Panini Manga agosto 2026',
          resumen: 'Lista completa de novedades y continuaciones de la editorial para este mes.',
          urlOrigen: 'https://ramenparados.com/',
          imagenUrl:
            'https://ramenparados.com/wp-content/uploads/2026/07/dark-gathering-15-destacado.jpg',
          fuente: 'RamenParaDos',
          fechaPublicacion: new Date('2026-07-13T00:00:00Z'),
        },
      ]
      res.json(popularNews)
    } catch (error) {
      console.error('Error fetching popular:', error)
      res.status(500).json({ error: 'Error al obtener noticias populares' })
    }
  }

  async proxyImage(req: Request, res: Response, _next: NextFunction) {
    try {
      const { url } = req.query
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Falta la URL de la imagen' })
      }

      const { buffer, contentType } = await obtenerImagenProtegida(url)

      if (contentType) {
        res.setHeader('Content-Type', contentType)
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000')
      res.send(buffer)
    } catch (error) {
      console.error('Proxy Image Error:', error)
      res.status(500).json({ error: 'Error al cargar imagen' })
    }
  }
}
