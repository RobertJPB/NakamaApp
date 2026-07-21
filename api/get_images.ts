

async function main() {
  const urls = [
    'https://ramenparados.com/hanako-kun-el-fantasma-del-lavabo-volvera-de-su-pausa-en-agosto/',
    'https://ramenparados.com/la-segunda-temporada-de-ao-ashi-llegara-a-crunchyroll/',
    'https://ramenparados.com/lanzamientos-panini-manga-agosto-2024/'
  ];
  
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
      const html = await res.text();
      const match = html.match(/<meta property="og:image" content="([^"]+)"/);
      console.log(url, '=>', match ? match[1] : 'not found');
    } catch(e) {
      console.error(e);
    }
  }
}
main();
