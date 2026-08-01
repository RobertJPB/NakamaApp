const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.usuario.findMany().then((u) => { 
  console.log(u.map(x => x.username)); 
  prisma.$disconnect(); 
}).catch(console.error);
