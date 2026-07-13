import { Anime } from '../../domain/entities/Anime'
import { IAnimeExternalService } from '../../application/interfaces/IAnimeExternalService'
import { mapAniListToAnime } from '../external/anilist/AniListMapper'
import { BUSCAR_ANIMES, DETALLE_ANIME, ANIMES_POPULARES } from '../external/anilist/AniListQueries'

const ANILIST_URL = 'https://graphql.anilist.co'

async function query(queryStr: string, variables: Record<string, any> = {}) {
  const body = JSON.stringify({ query: queryStr, variables })
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

  if (!res.ok) {
    const message = payload?.errors?.[0]?.message ?? text
    throw new Error(`AniList API error: ${res.status} - ${message}`)
  }

  if (payload.errors) {
    throw new Error(payload.errors[0]?.message ?? 'AniList API returned errors')
  }

  return payload.data
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
    return {
      anime:      mapAniListToAnime(data.Media),
      personajes: data.Media.characters?.nodes ?? [],
    }
  }

  async obtenerPopulares(pagina = 1) {
    const data = await query(ANIMES_POPULARES, { pagina })
    return data.Page.media.map(mapAniListToAnime)
  }
}
