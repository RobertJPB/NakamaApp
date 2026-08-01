const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const reqUserId = '69d92f80-a959-4cc1-957a-7fe036c6e1bd'; // prueba1
  let excludedIds = [];
  if (reqUserId) {
    excludedIds.push(reqUserId)
    const siguiendo = await prisma.seguidor.findMany({
      where: { seguidorId: reqUserId },
      select: { seguidoId: true }
    })
    excludedIds.push(...siguiendo.map(s => s.seguidoId))
  }
  
  console.log('Excluded IDs:', excludedIds);

  const sugeridos = await prisma.usuario.findMany({
    where: { id: { notIn: excludedIds } },
    take: 4,
    select: {
      id: true,
      username: true,
      nombreDisplay: true,
      avatarUrl: true,
      marcoUrl: true,
    },
    orderBy: {
      creadoEn: 'desc'
    }
  })
  
  console.log('Sugeridos:', sugeridos);
  prisma.$disconnect();
}
test();
