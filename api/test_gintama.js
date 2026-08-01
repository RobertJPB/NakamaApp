const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.anime.findMany({ where: { titulo: { contains: 'Gintama', mode: 'insensitive' } } })
  .then(res => { console.log(JSON.stringify(res, null, 2)); prisma.$disconnect(); });
