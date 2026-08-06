import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const poison = await prisma.anime.findMany({ where: { sinopsis: { contains: 'QUERY' } }, select: { externalId: true, titulo: true } })
  console.log('Envenenadas AHORA:', poison.length)
  poison.forEach(r => console.log(' -', r.externalId, r.titulo))
  const updated = await prisma.anime.findMany({ select: { updatedAt: true } })
  const maxUpd = updated.sort((a: any, b: any) => b.updatedAt - a.updatedAt)[0]
  console.log('updatedAt mas reciente en tabla Anime:', maxUpd?.updatedAt)
}
main().finally(() => prisma.$disconnect())
