import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Sembrando datos iniciales...')

  // Géneros base
  const generos = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
    'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
    'Sports', 'Supernatural', 'Thriller', 'Mecha', 'Music',
  ]
  for (const nombre of generos) {
    await prisma.genero.upsert({
      where:  { nombre },
      create: { nombre },
      update: {},
    })
  }

  // Demografías base
  const demografias = ['Shounen', 'Shoujo', 'Seinen', 'Josei', 'Kodomomuke']
  for (const nombre of demografias) {
    await prisma.demografia.upsert({
      where:  { nombre },
      create: { nombre },
      update: {},
    })
  }

  // Colecciones editoriales iniciales
  const colecciones = [
    { titulo: 'Animes para ver en una noche',      descripcion: 'Películas y series cortas perfectas para una maratón nocturna.' },
    { titulo: 'Para sentirte inspirado',           descripcion: 'Historias que te darán energía y motivación.' },
    { titulo: 'Joyas poco conocidas',              descripcion: 'Animes subestimados que merecen más atención.' },
    { titulo: 'Para cuando quieres llorar',        descripcion: 'Las historias más emotivas del anime.' },
    { titulo: 'Perfectos para el otoño',           descripcion: 'Animes con esa sensación acogedora de temporada fría.' },
    { titulo: 'Para enamorarse del romance',       descripcion: 'Las mejores historias de amor del anime.' },
  ]

  for (const col of colecciones) {
    await prisma.coleccion.upsert({
      where:  { id: col.titulo }, // simplificado para seed
      create: { ...col, esEditorial: true, esPublica: true },
      update: {},
    }).catch(() => prisma.coleccion.create({ data: { ...col, esEditorial: true, esPublica: true } }))
  }

  console.log('✅ Seed completado')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
