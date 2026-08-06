import Parser from 'rss-parser';
import { prisma } from '../database/prisma/client';
import { env } from '../../config/env';

const parser = new Parser();

export class NewsScraperService {
  async fetchAndStoreNews() {
    try {
      console.log('Iniciando recolección de noticias desde RamenParaDos...');
      const feed = await parser.parseURL(env.NEWS_RSS_URL);
      
      let agregadas = 0;

      for (const item of feed.items) {
        // RamenParaDos RSS format checking
        if (!item.title || !item.link) continue;

        const urlOrigen = item.link;
        const existing = await prisma.noticia.findFirst({
          where: { urlOrigen }
        });

        if (existing) continue; // Already processed this news

        const titulo = item.title;
        let resumen = item.contentSnippet || item.content || '';
        
        // Clean up summary
        resumen = resumen.replace(/<[^>]+>/g, '').substring(0, 500);

        // Fetch OG Image from article HTML
        let imagenUrl = null;
        try {
          const htmlRes = await fetch(urlOrigen);
          const html = await htmlRes.text();
          const match = html.match(/<meta property="og:image" content="([^"]+)"/);
          if (match && match[1]) {
            imagenUrl = match[1];
          }
        } catch (e) {
          console.error('No se pudo obtener imagen para', urlOrigen);
        }

        const fechaPublicacion = item.isoDate ? new Date(item.isoDate) : new Date();

        await prisma.noticia.create({
          data: {
            titulo,
            resumen,
            urlOrigen,
            imagenUrl,
            fuente: 'RamenParaDos',
            fechaPublicacion,
          }
        });
        
        agregadas++;
      }
      
      console.log(`Recolección terminada. Noticias nuevas agregadas: ${agregadas}`);
    } catch (error) {
      console.error('Error recolectando noticias:', error);
    }
  }
}
