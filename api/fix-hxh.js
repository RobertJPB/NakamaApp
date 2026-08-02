// Fix Hunter x Hunter (2011) score directly
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // Find all Hunter x Hunter entries in the DB
  const hxhAnimes = await prisma.anime.findMany({
    where: { titulo: { contains: 'Hunter', mode: 'insensitive' } }
  });
  console.log('HxH entries found:', hxhAnimes.map(a => ({ externalId: a.externalId, titulo: a.titulo, score: Number(a.calificacionPromedio) })));
  
  // Update HxH 2011 - Kitsu ID is 7442
  // MAL score as of 2025: 9.05
  const knownScore = 9.05;
  
  for (const anime of hxhAnimes) {
    if (anime.externalId === '7442' || anime.titulo.includes('(2011)') || (anime.titulo.toLowerCase().includes('hunter x hunter') && !anime.titulo.includes('1999'))) {
      await prisma.anime.update({
        where: { id: anime.id },
        data: { calificacionPromedio: knownScore }
      });
      console.log(`✅ Updated "${anime.titulo}" (${anime.externalId}) from ${Number(anime.calificacionPromedio)} → ${knownScore}`);
    }
  }
  
  await prisma.$disconnect();
  console.log('Done.');
}

run().catch(e => { console.error(e); process.exit(1); });
