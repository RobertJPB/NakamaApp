import { PrismaClient } from './api/node_modules/@prisma/client'
const prisma = new PrismaClient()

async function run() {
  try {
    console.log('Renaming anilist_id to external_id in animes...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "catalogo"."animes" RENAME COLUMN "anilist_id" TO "external_id";`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "catalogo"."animes" ALTER COLUMN "external_id" TYPE TEXT USING "external_id"::TEXT;`)
    
    console.log('Renaming anilist_personaje_id to external_id in personajes...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "catalogo"."personajes" RENAME COLUMN "anilist_personaje_id" TO "external_id";`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "catalogo"."personajes" ALTER COLUMN "external_id" TYPE TEXT USING "external_id"::TEXT;`)
    
    console.log('Migration successful!')
  } catch (err) {
    console.error('Migration error (maybe already ran?):', err.message)
  } finally {
    await prisma.$disconnect()
  }
}
run()
