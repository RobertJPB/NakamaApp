import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const q1 = await prisma.anime.findMany({ where: { sinopsis: { contains: 'QUERY LENGTH' } }, select: { externalId: true, titulo: true } })
  const q2 = await prisma.anime.findMany({ where: { sinopsis: { contains: 'MAX ALLOWED' } }, select: { externalId: true, titulo: true } })
  const q3 = await prisma.anime.findMany({ where: { sinopsis: { contains: 'QUERY' } }, select: { externalId: true, titulo: true } })
  const ids = new Set<string>()
  ;[...q1, ...q2, ...q3].forEach(r => ids.add(`${r.externalId} - ${r.titulo}`))
  console.log('QUERY LENGTH:', q1.length, '| MAX ALLOWED:', q2.length, '| QUERY (broad):', q3.length)
  console.log('Unicas:', ids.size)
  ids.forEach(id => console.log(' -', id))
}
main().finally(() => prisma.$disconnect())
