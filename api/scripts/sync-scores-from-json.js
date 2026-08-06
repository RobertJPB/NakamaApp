// Sync ALL DB scores from mal-ranking.json and insert missing animes
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function run() {
  const filePath = path.join(__dirname, '../src/infrastructure/data/mal-ranking.json');
  const ranking = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  console.log(`Sincronizando ${ranking.length} animes desde mal-ranking.json...`);
  
  let updated = 0;
  let inserted = 0;
  
  for (const entry of ranking) {
    if (!entry.calificacionPromedio || entry.calificacionPromedio <= 0) continue;
    if (!entry.externalId) continue;
    
    const anime = await prisma.anime.findFirst({ 
      where: { externalId: entry.externalId.toString() }
    });
    
    const newScore = Number(entry.calificacionPromedio);
    
    if (anime) {
      const currentScore = Number(anime.calificacionPromedio);
      if (Math.abs(currentScore - newScore) > 0.001) {
        await prisma.anime.update({
          where: { id: anime.id },
          data: { calificacionPromedio: newScore }
        });
        console.log(`  ✅ Update ${anime.titulo}: ${currentScore} → ${newScore}`);
        updated++;
      }
    } else {
      // Insertar el anime faltante usando solo los datos básicos del ranking
      // Esto asegura que la página de "Mejor Valorados" muestre el top real de MAL
      await prisma.anime.create({
        data: {
          externalId: entry.externalId.toString(),
          titulo: entry.titulo,
          imagenUrl: entry.imagenUrl,
          tipo: entry.tipo || 'TV',
          anio: entry.anio,
          calificacionPromedio: newScore,
          totalResenas: 0,
          totalEnListas: 0
        }
      });
      console.log(`  ➕ Inserted ${entry.titulo} (${entry.externalId}) with score ${newScore}`);
      inserted++;
    }
  }
  
  console.log(`\n✅ Actualizados: ${updated} | ➕ Insertados: ${inserted}`);
  
  // Verificar top 10
  console.log('\n--- Top 10 en BD ahora ---');
  const top10 = await prisma.anime.findMany({ 
    orderBy: { calificacionPromedio: 'desc' }, 
    take: 10 
  });
  top10.forEach((a, i) => {
    const score = Number(a.calificacionPromedio).toFixed(2);
    console.log(`${(i+1).toString().padStart(2)}. [${a.externalId}] ${a.titulo} → ${score}`);
  });
  
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
