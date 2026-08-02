// Restore correct MAL scores for animes that were overwritten
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Scores from the fix-scores.ts run output (verified from MAL)
const correctScores = [
  { externalId: '46474', titulo: 'Frieren', score: 9.25 },  // MAL: 52991
  { externalId: '11061', titulo: 'Hunter x Hunter (2011)', score: 9.05 }, // MAL: 11061 - from HxH fix
];

async function run() {
  for (const entry of correctScores) {
    // Try by externalId first, then by title
    let anime = await prisma.anime.findFirst({ where: { externalId: entry.externalId } });
    if (!anime) {
      anime = await prisma.anime.findFirst({ where: { titulo: { contains: entry.titulo, mode: 'insensitive' } } });
    }
    
    if (anime) {
      console.log(`Found: "${anime.titulo}" (${anime.externalId}) - current score: ${Number(anime.calificacionPromedio)}`);
      await prisma.anime.update({
        where: { id: anime.id },
        data: { calificacionPromedio: entry.score }
      });
      console.log(`  ✅ Updated to ${entry.score}`);
    } else {
      console.log(`❌ Not found: ${entry.titulo} (${entry.externalId})`);
    }
  }
  
  // Also verify all scores look correct
  console.log('\n--- Top 10 by score in DB ---');
  const top10 = await prisma.anime.findMany({ orderBy: { calificacionPromedio: 'desc' }, take: 10 });
  top10.forEach((a, i) => console.log(`${i+1}. ${a.titulo} - ${Number(a.calificacionPromedio)}`));
  
  await prisma.$disconnect();
  console.log('\nDone.');
}

run().catch(e => { console.error(e); process.exit(1); });
