import { Request, Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma/client';

export class NoticiasController {
  async getNoticias(req: Request, res: Response) {
    try {
      const { limit = 6 } = req.query;
      
      const noticias = await prisma.noticia.findMany({
        take: Number(limit),
        orderBy: { fechaPublicacion: 'desc' },
      });
      
      res.json(noticias);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener noticias' });
    }
  }

  async getPopular(req: Request, res: Response) {
    try {
      const popularNews = [
        {
          id: 'pop-1',
          titulo: 'Hanako-kun, el fantasma del lavabo volverá de su pausa en agosto',
          resumen: 'El manga regresará con un nuevo capítulo este próximo mes.',
          urlOrigen: 'https://ramenparados.com/',
          imagenUrl: 'https://ramenparados.com/wp-content/uploads/2026/07/hanako-kun-destacado-alter.jpg',
          fuente: 'RamenParaDos',
          fechaPublicacion: new Date('2026-07-14T00:00:00Z')
        },
        {
          id: 'pop-2',
          titulo: 'La segunda temporada de Ao Ashi llegará a Crunchyroll',
          resumen: 'Crunchyroll confirma el simulcast de la esperada continuación del anime de fútbol.',
          urlOrigen: 'https://ramenparados.com/',
          imagenUrl: 'https://ramenparados.com/wp-content/uploads/2026/07/AoAshi_Season2_Portada.webp',
          fuente: 'RamenParaDos',
          fechaPublicacion: new Date('2026-07-10T00:00:00Z')
        },
        {
          id: 'pop-3',
          titulo: 'Lanzamientos Panini Manga agosto 2026',
          resumen: 'Lista completa de novedades y continuaciones de la editorial para este mes.',
          urlOrigen: 'https://ramenparados.com/',
          imagenUrl: 'https://ramenparados.com/wp-content/uploads/2026/07/dark-gathering-15-destacado.jpg',
          fuente: 'RamenParaDos',
          fechaPublicacion: new Date('2026-07-13T00:00:00Z')
        }
      ];
      res.json(popularNews);
    } catch (error) {
      console.error('Error fetching popular:', error);
      res.status(500).json({ error: 'Error al obtener noticias populares' });
    }
  }

  async proxyImage(req: Request, res: Response) {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Falta la URL de la imagen' });
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`Error fetching image: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error('Proxy Image Error:', error);
      res.status(500).json({ error: 'Error al cargar imagen' });
    }
  }
}
