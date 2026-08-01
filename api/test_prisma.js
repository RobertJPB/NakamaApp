const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const excludedIds = ['2e0682ae-f2db-4590-b7ba-28bb312ffda7'];
  const res = await prisma.usuario.findMany({
    where: { id: { notIn: excludedIds } },
    take: 4
  });
  console.log('Result:', res);
  prisma.$disconnect();
}
test();
