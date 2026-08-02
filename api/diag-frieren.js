// Diagnose Frieren issues
// 1. Check Kitsu mapping endpoint for Frieren (ID: 46474)
// 2. Check DB score

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // Check DB score
  const frieren = await prisma.anime.findFirst({ where: { externalId: '46474' } });
  console.log('DB score for Frieren:', frieren ? Number(frieren.calificacionPromedio) : 'NOT FOUND');
  
  // Test Kitsu mapping endpoint (what KitsuService uses)
  console.log('\nTesting filter[item_id] mapping endpoint...');
  const r1 = await fetch('https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[item_id]=46474&filter[item_type]=Anime', {
    headers: { 'Accept': 'application/vnd.api+json' }
  });
  const d1 = await r1.json();
  console.log('filter[item_id] result:', JSON.stringify(d1.data?.slice(0,2)));
  
  // Test relationship endpoint (what fix-scores.ts uses)
  console.log('\nTesting /anime/46474/mappings endpoint...');
  const r2 = await fetch('https://kitsu.io/api/edge/anime/46474/mappings', {
    headers: { 'Accept': 'application/vnd.api+json' }
  });
  const d2 = await r2.json();
  const malMapping = d2.data?.find(m => m.attributes?.externalSite === 'myanimelist/anime');
  console.log('MAL mapping from relationship:', malMapping ? malMapping.attributes : 'NOT FOUND');
  
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
