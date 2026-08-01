const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.listaUsuario.groupBy({
    by: ['animeId'],
    where: { estados: { has: 'Viendo' } },
    _count: { animeId: true },
    orderBy: { _count: { animeId: 'desc' } },
    take: 10,
  });
  console.log("Ranking 'Viendo':", rows);
  
  const animeIds = rows.map(r => r.animeId);
  const animes = await prisma.anime.findMany({ where: { id: { in: animeIds } } });
  
  console.log("Animes:", animes.map(a => ({ id: a.id, title: a.titulo })));
}

main().finally(() => prisma.$disconnect());
