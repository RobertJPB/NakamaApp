/**
 * Traduce a español las sinopsis que quedaron en inglés en la DB.
 *
 * Detecta sinopsis en inglés por densidad de stopwords inglesas (que no existen
 * en español) y, para cada una, re-consulta la sinopsis en inglés desde Kitsu,
 * la traduce con la lógica actual y actualiza la DB.
 */
import { PrismaClient } from '@prisma/client'
import { translateText } from '../src/infrastructure/external/kitsu/KitsuService'

const prisma = new PrismaClient()
const KITSU_URL = 'https://kitsu.io/api/edge'

const EN_WORDS = ['the', 'and', 'that', 'with', 'was', 'were', 'this', 'his', 'her', 'from', 'they', 'have', 'after', 'before', 'their', 'what', 'when', 'into', 'about', 'world', 'story', 'years', 'people', 'because', 'which']

const esIngles = (t: string | null | undefined) => {
  if (!t) return false
  const lower = (' ' + t + ' ').toLowerCase()
  const hits = EN_WORDS.reduce((acc, w) => acc + (lower.includes(` ${w} `) ? 1 : 0), 0)
  return hits >= 4
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function main() {
  const all = await prisma.anime.findMany({
    where: { sinopsis: { not: null } },
    select: { externalId: true, titulo: true, sinopsis: true },
  })

  const ingles = all.filter(a => esIngles(a.sinopsis))
  console.log(`Total: ${all.length}, en inglés: ${ingles.length}`)

  let arregladas = 0
  let fallos = 0
  let sinCambio = 0

  for (const anime of ingles) {
    try {
      const res = await fetch(`${KITSU_URL}/anime/${anime.externalId}`, {
        headers: { Accept: 'application/vnd.api+json' },
      })
      if (!res.ok) throw new Error(`Kitsu ${res.status}`)
      const data = await res.json() as any
      const sinopsisEn = (data.data?.attributes?.synopsis || '').trim()
      if (!sinopsisEn) throw new Error('Sinopsis vacía en Kitsu')

      const traducida = await translateText(sinopsisEn)
      if (!traducida) {
        fallos++
        console.log(`ING  ${anime.externalId} ${anime.titulo} -> traducción falló, se conserva en inglés`)
        await sleep(300)
        continue
      }

      // Solo actualizar si cambió y ya no parece inglés
      const s = traducida.trim()
      if (s === (anime.sinopsis || '').trim()) {
        sinCambio++
        console.log(`SAME ${anime.externalId} ${anime.titulo} (ya estaba igual)`)
      } else {
        await prisma.anime.update({
          where: { externalId: anime.externalId },
          data: { sinopsis: s },
        })
        arregladas++
        console.log(`OK   ${anime.externalId} ${anime.titulo} -> ${s.slice(0, 90)}...`)
      }
    } catch (err) {
      fallos++
      console.error(`FAIL ${anime.externalId} ${anime.titulo}: ${(err as Error).message}`)
    }
    await sleep(300)
  }

  console.log(`\nResultado: ${arregladas} traducidas, ${sinCambio} sin cambio, ${fallos} fallos.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
