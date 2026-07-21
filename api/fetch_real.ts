import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching live news from RamenParaDos API...');
  try {
    const res = await fetch('https://ramenparados.com/wp-json/wp/v2/posts?per_page=20&_embed=1', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const postsData = await res.json();
    const posts: any[] = postsData as any[];
    
    await prisma.noticia.deleteMany({});
    
    const noticias = posts.map((post: any) => {
      let imagenUrl = '';
      if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'].length > 0) {
        imagenUrl = post._embedded['wp:featuredmedia'][0].source_url;
      }
      
      let title = post.title.rendered.replace(/&#8211;/g, '-').replace(/&#8216;/g, "'").replace(/&#8217;/g, "'").replace(/&#038;/g, "&").replace(/&nbsp;/g, ' ').replace(/&#039;/g, "'");
      
      let excerpt = post.excerpt.rendered.replace(/<[^>]*>?/gm, '').replace(/&#8211;/g, '-').replace(/&#8216;/g, "'").replace(/&#8217;/g, "'").replace(/&#038;/g, "&").replace(/&nbsp;/g, ' ').replace(/&#039;/g, "'").replace(/&hellip;/g, "...");
      if (excerpt.length > 150) excerpt = excerpt.substring(0, 150) + '...';
      
      return {
        titulo: title,
        resumen: excerpt.trim(),
        urlOrigen: post.link,
        imagenUrl: imagenUrl,
        fuente: 'RamenParaDos',
        fechaPublicacion: new Date(post.date)
      };
    });
    
    await prisma.noticia.createMany({ data: noticias });
    console.log(`Successfully fetched and inserted ${noticias.length} real news articles from RamenParaDos!`);
  } catch(e) {
    console.error('Failed:', e);
  }
}
main();
