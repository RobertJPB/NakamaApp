const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.anime.findMany({ select: { id: true, titulo: true } })
  .then(res => { console.log(JSON.stringify(res, null, 2)); prisma.$disconnect(); });
