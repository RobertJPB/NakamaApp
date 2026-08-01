import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.usuario.findMany({
    orderBy: { creadoEn: 'desc' },
    take: 5
  })
  console.log("Last 5 users in Prisma:");
  console.log(users);
}

main().catch(console.error).finally(() => prisma.$disconnect())
