import fs from 'fs'
import path from 'path'

async function getKitsuIdFromMalId(malId: number): Promise<string | null> {
  try {
    const r = await fetch(`https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${malId}&include=item`)
    const data = await r.json()
    if (data && data.included && data.included.length > 0) {
      return data.included[0].id
    }
  } catch (err) {
    console.error(`Error fetching mapping for MAL ${malId}`, err)
  }
  return null
}

async function run() {
  console.log('Fetching Top 100 from Jikan (MyAnimeList)...')
  let malAnimes: any[] = []
  
  // Fetch 4 pages (25 items each) = 100 animes
  for (let i = 1; i <= 4; i++) {
    const res = await fetch(`https://api.jikan.moe/v4/top/anime?page=${i}`)
    if (res.ok) {
      const data = await res.json()
      malAnimes = [...malAnimes, ...data.data]
    }
    // Sleep to avoid rate limits (3 requests per second)
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`Fetched ${malAnimes.length} animes from MAL. Resolving Kitsu IDs...`)
  
  const finalRanking = []
  
  for (let i = 0; i < malAnimes.length; i++) {
    const a = malAnimes[i]
    console.log(`[${i+1}/100] Resolviendo ${a.title}...`)
    
    const kitsuId = await getKitsuIdFromMalId(a.mal_id)
    
    if (kitsuId) {
      finalRanking.push({
        externalId: kitsuId,
        titulo: a.title_english || a.title,
        imagenUrl: a.images.webp.large_image_url || a.images.jpg.large_image_url,
        tipo: a.type,
        anio: a.year || (a.aired?.from ? new Date(a.aired.from).getFullYear() : null),
        calificacionPromedio: a.score || 0
      })
    } else {
      console.log(`No se encontró Kitsu ID para ${a.title}, se omite.`)
    }
    
    // Slight delay for Kitsu API
    await new Promise(r => setTimeout(r, 100))
  }
  
  const filePath = path.join(__dirname, '../src/infrastructure/data/mal-ranking.json')
  
  // Asegurar que exista la carpeta
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  fs.writeFileSync(filePath, JSON.stringify(finalRanking, null, 2))
  console.log(`¡Ranking guardado exitosamente en ${filePath}!`)
}

run()
