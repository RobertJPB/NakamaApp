import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const name = 'Jujutsu Lovers'
  const imageUrl = 'https://cdn.pfps.gg/pfps/6085-itadori-24.png'

  const result = await prisma.comunidad.updateMany({
    where: { nombre: name },
    data: { imagenUrl: imageUrl }
  })

  console.log(`Updated ${result.count} communities.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
