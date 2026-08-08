import 'dotenv/config'
import { prisma } from '../src/infrastructure/database/prisma/client'
import { translateText } from '../src/infrastructure/external/kitsu/KitsuService'

const ES = new Set([
  'de','la','el','que','y','en','los','un','para','con','por','una','su','al','del','como',
  'mas','se','sus','sobre','entre','tambien','pero','este','esta','donde','cuando','muy',
  'ya','fue','era','todo','asi','han','ser','desde','hasta','sin','o','a','e','ni','lo','le',
  'nos','otro','tres','dos','vez','poco','puede','solo','tiene','estan','nuevo',
])

const EN = new Set([
  'the','of','and','to','in','a','is','for','on','with','that','it','as','his','her','this',
  'from','by','at','an','are','was','were','be','has','have','not','but','he','she','their',
  'they','you','more','after','when','who','which','about','into','over','him','them','its',
])

function esEspanol(texto: string): boolean {
  const words = texto.toLowerCase().match(/[a-záéíóúñü]+/g) || []
  const relevantes = words.filter((w) => w.length > 2)
  if (relevantes.length < 8) return true // texto corto: no vale la pena tocarlo
  let es = 0
  let en = 0
  for (const w of relevantes) {
    if (ES.has(w)) es++
    if (EN.has(w)) en++
  }
  return es >= en
}

const ESPERA_MS = 1200 // respetar rate limit de Google translate

function esperar(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const animes = await prisma.anime.findMany({
    where: { sinopsis: { not: null } },
    select: { id: true, externalId: true, titulo: true, sinopsis: true },
  })

  const aTraducir = animes.filter((a) => a.sinopsis && !esEspanol(a.sinopsis!))
  console.log(`Sinopsis NO española detectadas: ${aTraducir.length}/${animes.length}`)

  let ok = 0
  let fallo = 0
  for (let i = 0; i < aTraducir.length; i++) {
    const a = aTraducir[i]
    const original = a.sinopsis!
    process.stdout.write(`[${i + 1}/${aTraducir.length}] ${a.titulo} ... `)

    const traducida = await translateText(original)
    if (traducida && traducida.length > 0) {
      await prisma.anime.update({
        where: { id: a.id },
        data: { sinopsis: traducida },
      })
      ok++
      console.log('OK')
    } else {
      fallo++
      console.log('FALLO (se deja igual)')
    }
    await esperar(ESPERA_MS)
  }

  console.log('---')
  console.log(`Traducidas: ${ok} | Fallos: ${fallo}`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
