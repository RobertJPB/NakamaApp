/**
 * Repara sinopsis corruptas en la DB.
 *
 * Algunas sinopsis contienen el error de MyMemory "QUERY LENGTH LIMIT EXCEEDED.
 * MAX ALLOWED QUERY : 500 CHARS" (guardado por una versión anterior del traductor
 * que no filtraba la respuesta). Este script re-consulta la sinopsis en inglés
 * desde Kitsu, la traduce con la lógica actual (con filtro del error) y actualiza
 * la DB. Si la traducción falla, guarda la sinopsis original en inglés en vez del
 * mensaje de error.
 */
import { PrismaClient } from '@prisma/client'
import { translateText } from '../src/infrastructure/external/kitsu/KitsuService'

const prisma = new PrismaClient()
const KITSU_URL = 'https://kitsu.io/api/edge'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function main() {
  const corruptas = await prisma.anime.findMany({
    where: { sinopsis: { contains: 'QUERY LENGTH' } },
    select: { externalId: true, titulo: true },
  })
  console.log(`Sinopsis corruptas encontradas: ${corruptas.length}`)

  let arregladas = 0
  let fallos = 0

  for (const anime of corruptas) {
    try {
      const res = await fetch(`${KITSU_URL}/anime/${anime.externalId}`, {
        headers: { Accept: 'application/vnd.api+json' },
      })
      if (!res.ok) throw new Error(`Kitsu ${res.status}`)
      const data = await res.json() as any
      const sinopsisEn = (data.data?.attributes?.synopsis || '').trim()
      if (!sinopsisEn) throw new Error('Sinopsis vacía en Kitsu')

      const traducida = await translateText(sinopsisEn)

      const nuevaSinopsis = (traducida && traducida.length > 0)
        ? traducida
        : sinopsisEn

      await prisma.anime.update({
        where: { externalId: anime.externalId },
        data: { sinopsis: nuevaSinopsis },
      })

      if (traducida) {
        arregladas++
        console.log(`OK   ${anime.externalId} ${anime.titulo} -> traducida (${nuevaSinopsis.length} chars)`)
      } else {
        fallos++
        console.log(`ING  ${anime.externalId} ${anime.titulo} -> traducción falló, sinopsis en inglés (${nuevaSinopsis.length} chars)`)
      }
    } catch (err) {
      fallos++
      console.error(`FAIL ${anime.externalId} ${anime.titulo}: ${(err as Error).message}`)
    }
    await sleep(300)
  }

  console.log(`\nResultado: ${arregladas} traducidas, ${fallos} sin traducción (quedaron en inglés/error).`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
