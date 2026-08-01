import { KitsuService } from './api/src/infrastructure/external/kitsu/KitsuService'
import { prisma } from './api/src/infrastructure/database/prisma/client'

async function run() {
  try {
    const kitsuService = new KitsuService();
    console.log('Fetching from kitsu...');
    const resultado = await kitsuService.obtenerPopulares(1, 18);
    console.log('Kitsu results count:', resultado.length);
    
    if (resultado && resultado.length > 0) {
      const ids = resultado.map((a: any) => a.externalId)
      console.log('IDs from Kitsu:', ids);
      console.log('Fetching from Prisma...');
      const dbAnimes = await prisma.anime.findMany({ where: { externalId: { in: ids as string[] } } })
      console.log('Prisma results count:', dbAnimes.length);
    }
    
    console.log('Success!');
  } catch (err) {
    console.error('Error in controller logic:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
