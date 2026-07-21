const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.columnaKanban.deleteMany({
    where: {
      nombre: { in: ['Series', 'Películas'] }
    }
  });
  console.log('Deleted:', res);
}

main().catch(console.error).finally(() => prisma.$disconnect());
