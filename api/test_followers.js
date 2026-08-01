const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.seguidor.findMany().then(u => {
  console.log('Followers:', u);
  prisma.$disconnect();
});
