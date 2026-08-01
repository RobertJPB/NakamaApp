const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.usuario.findMany().then(u => {
  console.log('Total users:', u.length);
  console.log(u.map(us => us.id + ' - ' + us.username));
  prisma.$disconnect();
});
