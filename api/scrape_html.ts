import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fetching RamenParaDos HTML...');
    const response = await fetch('https://ramenparados.com/?nowprocket=1', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await response.text();
    
    // We can scrape from the main content instead of just tab1 to get more news
    // Let's just grab any standard article block.
    // The previous regex was for popular sidebar.
    // Let's use a broader regex or just the sidebar one for now.
    const tab1Index = html.indexOf('<div id="tab1"');
    if (tab1Index === -1) {
      console.log('Could not find tab1');
      return;
    }
    const tab1Html = html.substring(tab1Index, html.indexOf('</ul>', tab1Index));

    const itemRegex = /<li[^>]*>[\s\S]*?<a href="([^"]+)">[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<div class="sidebar-list-text[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?<span class="widget-post-date">([^<]+)<\/span>/gi;
    
    let match;
    const noticias = [];
    while ((match = itemRegex.exec(tab1Html)) !== null) {
      const highResImage = match[2].replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/i, '');
      
      let fecha = new Date();
      if (match[4]) {
        const [d, m, y] = match[4].split('/');
        if (d && m && y) {
          fecha = new Date(`${y}-${m}-${d}T12:00:00Z`);
        }
      }

      noticias.push({
        urlOrigen: match[1],
        imagenUrl: highResImage,
        titulo: match[3].trim(),
        fechaPublicacion: fecha,
        fuente: 'RamenParaDos',
        resumen: 'Noticia de RamenParaDos'
      });
    }

    // Now let's get some from the main feed as well if possible
    const mainRegex = /<div class="post-thumbnail">[\s\S]*?<a href="([^"]+)">[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<h3 class="title">[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi;
    while ((match = mainRegex.exec(html)) !== null) {
      if (noticias.length >= 15) break;
      const highResImage = match[2].replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/i, '');
      const url = match[1];
      if (!noticias.find(n => n.urlOrigen === url)) {
        noticias.push({
          urlOrigen: url,
          imagenUrl: highResImage,
          titulo: match[3].trim(),
          fechaPublicacion: new Date(),
          fuente: 'RamenParaDos',
          resumen: 'Noticia de RamenParaDos'
        });
      }
    }

    // Delete mock news first
    await prisma.noticia.deleteMany({ where: { fuente: 'Mock' } });

    let added = 0;
    for (const n of noticias) {
      const exists = await prisma.noticia.findFirst({ where: { urlOrigen: n.urlOrigen } });
      if (!exists) {
        await prisma.noticia.create({ data: n });
        added++;
      }
    }

    console.log(`Successfully added ${added} news from RamenParaDos.`);
  } catch (err) {
    console.error(err);
  }
}
main();
