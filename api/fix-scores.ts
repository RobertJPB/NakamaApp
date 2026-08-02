import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const animes = await prisma.anime.findMany();
  console.log('Total animes:', animes.length);
  let count = 0;
  for (const anime of animes) {
    try {
      const res = await fetch(`https://kitsu.io/api/edge/anime/${anime.externalId}/mappings`);
      const json = await res.json() as any;
      const malMapping = json.data?.find((m: any) => m.attributes.externalSite === 'myanimelist/anime');
      if (malMapping) {
        const malId = malMapping.attributes.externalId;
        const malRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
        if (malRes.ok) {
          const malJson = await malRes.json() as any;
          const score = malJson.data?.score;
          if (score) {
            await prisma.anime.update({
              where: { id: anime.id },
              data: { calificacionPromedio: score }
            });
            console.log(`Updated ${anime.titulo} to ${score}`);
            count++;
          } else {
            console.log(`No score found for ${anime.titulo} (MAL: ${malId})`);
          }
        } else {
            console.log(`Jikan error for ${anime.titulo} (MAL: ${malId})`);
        }
        await new Promise(r => setTimeout(r, 600)); // Rate limit Jikan
      } else {
        console.log(`No MAL mapping found for ${anime.titulo}`);
      }
    } catch(e: any) {
      console.log('Error processing', anime.titulo, e.message);
    }
  }
  console.log(`Done. Updated ${count} animes.`);
}
run();
