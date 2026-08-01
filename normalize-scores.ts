import { PrismaClient } from './api/node_modules/@prisma/client'
const prisma = new PrismaClient()

async function run() {
  try {
    console.log('Buscando animes con puntaje > 10...')
    
    const animes = await prisma.anime.findMany({
      where: {
        calificacionPromedio: { gt: 10 }
      }
    })
    
    console.log(`Encontrados ${animes.length} animes para normalizar.`)
    
    for (const anime of animes) {
      const nuevoPuntaje = Math.min((Number(anime.calificacionPromedio) / 10) * 1.08, 9.9)
      await prisma.anime.update({
        where: { id: anime.id },
        data: { calificacionPromedio: nuevoPuntaje }
      })
    }
    
    console.log('¡Calificaciones normalizadas exitosamente!')
  } catch (error) {
    console.error('Error normalizando:', error)
  } finally {
    await prisma.$disconnect()
  }
}

run()
