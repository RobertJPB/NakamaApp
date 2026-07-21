import { PrismaClient } from '@prisma/client'; 
import Parser from 'rss-parser';

const prisma = new PrismaClient(); 
const parser = new Parser();

async function main() { 
  console.log('Fetching real news from Crunchyroll...');
  try {
    const feed = await parser.parseURL('https://www.crunchyroll.com/newsrss?lang=esES');
    
    await prisma.noticia.deleteMany({});
    
    const noticias = [];
    for (let i = 0; i < Math.min(6, feed.items.length); i++) {
      const item = feed.items[i];
      
      let imagenUrl = 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx166240-h9F0JqQn36Z0.png';
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      const content = item.content || item.contentSnippet || '';
      const match = imgRegex.exec(content);
      if (match && match[1]) {
        imagenUrl = match[1];
      }
      
      noticias.push({
        titulo: item.title || 'Noticia de Anime',
        resumen: (item.contentSnippet || '').substring(0, 150) + '...',
        urlOrigen: item.link || 'https://crunchyroll.com',
        imagenUrl,
        fuente: 'Crunchyroll',
        fechaPublicacion: item.pubDate ? new Date(item.pubDate) : new Date()
      });
    }
    
    await prisma.noticia.createMany({ data: noticias });
    console.log(`Successfully added ${noticias.length} real news articles from Crunchyroll.`);
  } catch (err) {
    console.error('Error fetching real news:', err);
  }
} 
main();
