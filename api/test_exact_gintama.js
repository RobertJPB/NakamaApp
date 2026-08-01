const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.anime.findMany({ where: { titulo: { equals: 'Gintama: The Movie: The Final Chapter: Be Forever Yorozuya' } } })
  .then(res => { console.log(JSON.stringify(res, null, 2)); prisma.$disconnect(); });
