const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.usuario.findUnique({
  where: { username: 'robertjpb' },
  include: {
    _count: {
      select: {
        seguidores: true,
        siguiendo:  true,
        lista:      true,
        resenas:    true,
      }
    }
  }
}).then((u) => { 
  console.log(u); 
  prisma.$disconnect(); 
}).catch(e => {
  console.error(e);
  prisma.$disconnect();
});
