import { Anime } from '../../domain/entities/Anime'
import { IAnimeExternalService } from '../../application/interfaces/IAnimeExternalService'
import { mapAniListToAnime } from '../external/anilist/AniListMapper'
import { BUSCAR_ANIMES, DETALLE_ANIME, ANIMES_POPULARES } from '../external/anilist/AniListQueries'

const ANILIST_URL = 'https://graphql.anilist.co'

const TRADUCCION_GENEROS: Record<string, string> = {
  Action: "Acción",
  Adventure: "Aventura",
  Comedy: "Comedia",
  Drama: "Drama",
  Fantasy: "Fantasía",
  Horror: "Terror",
  Mystery: "Misterio",
  Romance: "Romance",
  "Sci-Fi": "Ciencia Ficción",
  "Slice of Life": "Recuentos de la vida",
  Sports: "Deportes",
  Supernatural: "Sobrenatural",
  Thriller: "Suspenso",
  Psychological: "Psicológico",
  Mecha: "Mecha",
  Music: "Música",
  "Mahou Shoujo": "Chicas Mágicas",
  Ecchi: "Ecchi",
  Hentai: "Hentai"
}

async function translateToSpanish(text: string): Promise<string> {
  if (!text) return text;
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`);
    const data: any = await res.json();
    return data[0].map((item: any) => item[0]).join('');
  } catch (err) {
    console.error('Translation error:', err);
    return text;
  }
}

async function queryWithRetry(queryStr: string, variables: Record<string, any> = {}, retries = 3): Promise<any> {
  const body = JSON.stringify({ query: queryStr, variables })
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Nakama API Client',
        },
        body,
      })

      const text = await res.text()
      let payload: any
      try {
        payload = JSON.parse(text)
      } catch (parseError) {
        throw new Error(`AniList API invalid JSON (${res.status}): ${text}`)
      }

      // Rate limited - wait and retry
      if (res.status === 429) {
        const waitMs = attempt * 1500
        console.warn(`AniList rate limited (attempt ${attempt}/${retries}), waiting ${waitMs}ms...`)
        await new Promise(r => setTimeout(r, waitMs))
        continue
      }

      if (!res.ok) {
        const message = payload?.errors?.[0]?.message ?? text
        throw new Error(`AniList API error: ${res.status} - ${message}`)
      }

      if (payload.errors) {
        throw new Error(payload.errors[0]?.message ?? 'AniList API returned errors')
      }

      return payload.data
    } catch (err: any) {
      if (attempt === retries) throw err
      const waitMs = attempt * 1000
      console.warn(`AniList query failed (attempt ${attempt}/${retries}), retrying in ${waitMs}ms:`, err.message)
      await new Promise(r => setTimeout(r, waitMs))
    }
  }
}

async function query(queryStr: string, variables: Record<string, any> = {}) {
  return queryWithRetry(queryStr, variables)
}

export class AniListService implements IAnimeExternalService {
  async buscarAnimes(busqueda: string, pagina = 1) {
    const data = await query(BUSCAR_ANIMES, { busqueda, pagina })
    return {
      pageInfo: data.Page.pageInfo,
      animes:   data.Page.media.map(mapAniListToAnime),
    }
  }

  async obtenerDetalle(anilistId: number) {
    const data = await query(DETALLE_ANIME, { id: anilistId })
    const animeMapped = mapAniListToAnime(data.Media)
    if (animeMapped.sinopsis) {
      animeMapped.sinopsis = await translateToSpanish(animeMapped.sinopsis)
    }

    if (data.Media.idMal) {
      try {
        const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${data.Media.idMal}`)
        if (jikanRes.ok) {
          const jikanData: any = await jikanRes.json()
          const malScore = jikanData.data?.score
          if (malScore) {
            animeMapped.calificacionPromedio = malScore
          }
        }
      } catch (e) {
        console.error('Error fetching MAL score:', e)
      }
    }
    return {
      anime:      animeMapped,
      generos:    (data.Media.genres ?? []).map((g: string) => TRADUCCION_GENEROS[g] || g),
      personajes: (data.Media.characters?.nodes ?? []).map((c: any) => ({
        id: c.id,
        nombre: c.name?.full || c.name?.native || 'Desconocido',
        imagenUrl: c.image?.large,
      })),
    }
  }

  async obtenerPopulares(pagina = 1, perPage = 18, genre?: string, seasonYear?: number) {
    const data = await query(ANIMES_POPULARES, { pagina, perPage, genre, seasonYear })
    return data.Page.media.map(mapAniListToAnime)
  }
}
