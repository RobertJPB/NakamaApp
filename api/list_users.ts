import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function listUsers() {
  const users = await prisma.usuario.findMany({ select: { username: true } });
  console.log(users.map(u => u.username).join(', '));
  await prisma.$disconnect();
}
listUsers();
