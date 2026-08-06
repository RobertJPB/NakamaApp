import { prisma } from '../src/infrastructure/database/prisma/client'

async function main() {
  console.log('Fetching all animes to sync MAL scores...')
  const animes = await prisma.anime.findMany()

  console.log(`Found ${animes.length} animes to update.`)

  for (const anime of animes) {
    if (!anime.anilistId) continue

    const query = `
      query {
        Media(id: ${anime.anilistId}, type: ANIME) {
          idMal
        }
      }
    `
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
    const json: any = await res.json()
    const idMal = json.data?.Media?.idMal

    if (idMal) {
      try {
        const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${idMal}`)
        if (jikanRes.ok) {
          const jikanData: any = await jikanRes.json()
          const score = jikanData.data?.score
          if (score) {
            await prisma.anime.update({
              where: { id: anime.id },
              data: { calificacionPromedio: score }
            })
            console.log(`Updated ${anime.titulo} with MAL score ${score}`)
          }
        }
      } catch (e) {
        console.error('Failed to get Jikan score for', anime.titulo)
      }
    }
    
    // Jikan has rate limits (3 requests per second), so wait 500ms
    await new Promise(r => setTimeout(r, 500))
  }
  console.log("Done updating scores.")
}

main().catch(console.error)
