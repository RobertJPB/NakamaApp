const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.listaUsuario.findMany({ include: { anime: { select: { titulo: true } } } })
  .then(res => { console.log(JSON.stringify(res, null, 2)); prisma.$disconnect(); });
