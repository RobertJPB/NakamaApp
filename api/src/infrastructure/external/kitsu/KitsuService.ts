import { IAnimeExternalService } from '../../../application/interfaces/IAnimeExternalService'
import { mapKitsuToAnime } from './KitsuMapper'
import { Anime } from '../../../domain/entities/Anime'

const KITSU_URL = 'https://kitsu.io/api/edge'

// Cache para notas MAL: kitsuId -> { score, timestamp }
const malScoreCache = new Map<string, { score: number; ts: number }>()
const MAL_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

async function getMalScoreForKitsuId(kitsuId: string): Promise<number | null> {
  // Check cache first
  const cached = malScoreCache.get(kitsuId)
  if (cached && Date.now() - cached.ts < MAL_CACHE_TTL_MS) {
    return cached.score
  }

  try {
    // Obtener el MAL ID desde el mapping de Kitsu
    const mappingRes = await fetch(
      `${KITSU_URL}/mappings?filter[externalSite]=myanimelist/anime&filter[item_id]=${kitsuId}&filter[item_type]=Anime`,
      { headers: { 'Accept': 'application/vnd.api+json' } }
    )
    if (!mappingRes.ok) return null
    const mappingData = await mappingRes.json() as any
    const malId = mappingData.data?.[0]?.attributes?.externalId
    if (!malId) return null

    // Consultar Jikan (API pública de MAL) para obtener la nota
    const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}`)
    if (!jikanRes.ok) return null
    const jikanData = await jikanRes.json() as any
    const score = jikanData.data?.score
    if (!score) return null

    const rounded = parseFloat(score.toFixed(2))
    malScoreCache.set(kitsuId, { score: rounded, ts: Date.now() })
    return rounded
  } catch (err) {
    // Si falla, simplemente no actualizamos la nota
    return null
  }
}

async function translateText(text: string): Promise<string> {
  if (!text) return text;
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=es&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json() as any;
    return data[0].map((item: any) => item[0]).join('');
  } catch (err) {
    console.error("Translation error:", err);
    return text;
  }
}

const GENRE_MAP: Record<string, string> = {
  "Action": "Acción",
  "Adventure": "Aventura",
  "Comedy": "Comedia",
  "Drama": "Drama",
  "Fantasy": "Fantasía",
  "Horror": "Terror",
  "Mystery": "Misterio",
  "Romance": "Romance",
  "Sci-Fi": "Ciencia Ficción",
  "Slice of Life": "Recuentos de la vida",
  "Sports": "Deportes",
  "Supernatural": "Sobrenatural",
  "Thriller": "Suspenso",
  "Psychological": "Psicológico",
  "Music": "Música",
  "Mahou Shoujo": "Chicas Mágicas",
  "Mecha": "Mecha",
  "Ecchi": "Ecchi"
};

export class KitsuService implements IAnimeExternalService {
  private async fetchKitsu(endpoint: string) {
    const url = `${KITSU_URL}${endpoint}`
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }
    })
    if (!res.ok) throw new Error(`Kitsu API error: ${res.status} - ${res.statusText}`)
    return await res.json() as any
  }

  private async fetchKitsuPaginated(baseEndpoint: string, limitRequerido: number, offsetInicial: number) {
    const promises = []
    let fetched = 0
    let currentOffset = offsetInicial
    const separator = baseEndpoint.includes('?') ? '&' : '?'

    while (fetched < limitRequerido) {
      const take = Math.min(20, limitRequerido - fetched)
      const url = `${baseEndpoint}${separator}page[limit]=${take}&page[offset]=${currentOffset}`
      promises.push(this.fetchKitsu(url))
      fetched += take
      currentOffset += take
    }

    const results = await Promise.all(promises)
    const combinedData = results.reduce((acc: any[], curr: any) => acc.concat(curr.data || []), [])
    const count = results[0]?.meta?.count || 0

    return { data: combinedData, meta: { count } }
  }

  async buscarAnimes(busqueda: string, pagina = 1, perPage = 20) {
    const limit = perPage
    const offset = (pagina - 1) * limit
    const query = encodeURIComponent(busqueda)
    
    const data = await this.fetchKitsuPaginated(`/anime?filter[text]=${query}`, limit, offset)
    
    let animes = (data.data || []).map(mapKitsuToAnime)

    // Reordenar localmente para dar prioridad si el título coincide de forma exacta o empieza con la búsqueda
    const q = busqueda.toLowerCase().trim()
    animes.sort((a, b) => {
      const titleA = (a.titulo || '').toLowerCase()
      const titleB = (b.titulo || '').toLowerCase()
      
      const aStarts = titleA === q || titleA.startsWith(`${q}:`) || titleA.startsWith(`${q} `)
      const bStarts = titleB === q || titleB.startsWith(`${q}:`) || titleB.startsWith(`${q} `)
      
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return 0
    })

    // Enriquecer notas con MAL en paralelo
    await Promise.all(
      animes.map(async (anime: any) => {
        if (!anime.externalId) return
        const malScore = await getMalScoreForKitsuId(anime.externalId)
        if (malScore !== null) anime.calificacionPromedio = malScore
      })
    )

    return {
      pageInfo: {
        total: data.meta?.count || 0,
        currentPage: pagina,
        lastPage: Math.ceil((data.meta?.count || 0) / limit)
      },
      animes
    }
  }

  async obtenerDetalle(externalId: string) {
    const data = await this.fetchKitsu(`/anime/${externalId}?include=categories,characters.character`)
    const animeData = data.data
    const included = data.included || []

    const rawCategories = included
      .filter((inc: any) => inc.type === 'categories')
      .map((cat: any) => cat.attributes?.title);

    let generos: string[] = [];
    let unknownGenres: string[] = [];

    rawCategories.forEach((cat: string) => {
      if (GENRE_MAP[cat]) {
        generos.push(GENRE_MAP[cat]);
      } else if (cat) {
        unknownGenres.push(cat);
      }
    });

    if (unknownGenres.length > 0) {
      const joined = unknownGenres.join(' | ');
      const translatedStr = await translateText(joined);
      const translatedArr = translatedStr.split('|').map(s => s.trim());
      // Reemplazamos los desconocidos por sus traducciones
      unknownGenres.forEach((cat, index) => {
        generos.push(translatedArr[index] ? translatedArr[index].replace(/(^[\s,]+|[\s,]+$)/g, '') : cat);
      });
    }

    // Capitalizamos la primera letra de cada género para que se vea bien
    generos = generos.map(g => g.charAt(0).toUpperCase() + g.slice(1));

    let animeMapping = mapKitsuToAnime(animeData);

    // Obtener nota MAL y traducción en paralelo para no añadir latencia extra
    const [sinopsisTraducida, malScore] = await Promise.all([
      animeMapping.sinopsis ? translateText(animeMapping.sinopsis) : Promise.resolve(animeMapping.sinopsis),
      getMalScoreForKitsuId(externalId)
    ])

    if (sinopsisTraducida) animeMapping.sinopsis = sinopsisTraducida
    // Reemplazar nota de Kitsu por la nota real de MAL si se obtuvo
    if (malScore !== null) animeMapping.calificacionPromedio = malScore

    const personajes = included
      .filter((inc: any) => inc.type === 'characters')
      .map((char: any) => ({
        id: char.id,
        nombre: char.attributes?.names?.en || char.attributes?.canonicalName || 'Desconocido',
        imagenUrl: char.attributes?.image?.original || char.attributes?.image?.large || null
      }));

    if (personajes.length > 0) {
      const namesToTranslate = personajes.map((p: any) => p.nombre).join(' | ');
      const translatedNamesStr = await translateText(namesToTranslate);
      const translatedNamesArr = translatedNamesStr.split('|').map((s: string) => s.trim());
      
      personajes.forEach((p: any, index: number) => {
        if (translatedNamesArr[index]) {
          p.nombre = translatedNamesArr[index].replace(/(^[\s,]+|[\s,]+$)/g, '');
        }
      });
    }

    // Parche manual para "Orb: On the Movements of the Earth" ya que Kitsu no tiene personajes aún y su sinopsis es muy corta
    if (animeMapping.titulo?.toLowerCase().includes("orb: on the movements")) {
      animeMapping.sinopsis = "En la Europa del siglo XV, la herejía es castigada con la quema en la hoguera. Rafal, un niño prodigio, está destinado a especializarse en teología en la universidad, pero su encuentro con un misterioso erudito lo lleva a descubrir una verdad prohibida: que la Tierra se mueve alrededor del Sol.\n\nAtrapado entre su sed de conocimiento y la implacable persecución de la Inquisición, Rafal deberá decidir si vale la pena arriesgar su propia vida por proteger y transmitir esta revolucionaria investigación a las futuras generaciones.";
      const wrapProxy = (url: string) => `/api/animes/proxy-image?url=${encodeURIComponent(url)}`;
      personajes.push(
        { id: '279996', nombre: 'Nowak', imagenUrl: wrapProxy('https://s4.anilist.co/file/anilistcdn/character/large/b279996-MdHZp8RFDafh.png') },
        { id: '280003', nombre: 'Draka', imagenUrl: wrapProxy('https://s4.anilist.co/file/anilistcdn/character/large/b280003-Fu17utO1VAsD.png') },
        { id: '280005', nombre: 'Schmitt', imagenUrl: wrapProxy('https://s4.anilist.co/file/anilistcdn/character/large/b280005-7OvMzRzuFVPx.png') },
        { id: '280002', nombre: 'Oczy', imagenUrl: wrapProxy('https://s4.anilist.co/file/anilistcdn/character/large/b280002-3E9GkKZ8YH9D.png') },
        { id: '279999', nombre: 'Badeni', imagenUrl: wrapProxy('https://s4.anilist.co/file/anilistcdn/character/large/b279999-VKadGXZplQiE.png') },
        { id: '280001', nombre: 'Rafał', imagenUrl: wrapProxy('https://s4.anilist.co/file/anilistcdn/character/large/b280001-40iXrV4vLyqR.png') },
        { id: '279998', nombre: 'Jolenta', imagenUrl: wrapProxy('https://s4.anilist.co/file/anilistcdn/character/large/b279998-Jxzcihblmclf.png') },
        { id: '279995', nombre: 'Kolbe', imagenUrl: wrapProxy('https://s4.anilist.co/file/anilistcdn/character/large/b279995-4n4fhISlYg9Z.png') }
      );
    }

    return {
      anime: animeMapping,
      generos,
      personajes
    }
  }

  async obtenerPopulares(pagina = 1, perPage = 18, genre?: string, seasonYear?: number) {
    const limit = perPage
    const offset = (pagina - 1) * limit
    let url = `/anime?sort=-userCount`
    if (genre) url += `&filter[categories]=${encodeURIComponent(genre)}`
    if (seasonYear) url += `&filter[seasonYear]=${seasonYear}`

    const data = await this.fetchKitsuPaginated(url, limit, offset)
    const animes = (data.data || []).map(mapKitsuToAnime)

    // Enriquecer notas con MAL en paralelo (no bloqueante: si falla no afecta la respuesta)
    await Promise.all(
      animes.map(async (anime: any) => {
        if (!anime.externalId) return
        const malScore = await getMalScoreForKitsuId(anime.externalId)
        if (malScore !== null) anime.calificacionPromedio = malScore
      })
    )

    return animes
  }

  async buscarPersonajes(busqueda: string) {
    const query = `
      query ($search: String) {
        CharSearch: Page(page: 1, perPage: 15) {
          characters(search: $search, sort: [SEARCH_MATCH, FAVOURITES_DESC]) {
            id
            name { full }
            image { large }
            media(sort: POPULARITY_DESC, type: ANIME) {
              nodes { title { romaji } }
            }
          }
        }
        AnimeSearch: Page(page: 1, perPage: 3) {
          media(search: $search, type: ANIME, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
            title { romaji }
            characters(sort: [FAVOURITES_DESC], page: 1, perPage: 25) {
              nodes {
                id
                name { full }
                image { large }
              }
            }
          }
        }
      }
    `;
    
    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { search: busqueda }
        })
      });
      
      const json = await response.json() as any;
      
      const charsFromName = json.data?.CharSearch?.characters || [];
      const animes = json.data?.AnimeSearch?.media || [];
      
      const charsFromAnime = animes.flatMap((anime: any) => {
        return (anime.characters?.nodes || []).map((c: any) => ({
          ...c,
          media: { nodes: [{ title: anime.title }] }
        }));
      });
      
      // Combinar y deduplicar
      const allChars = [...charsFromAnime, ...charsFromName];
      const seen = new Set();
      const uniqueChars = allChars.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
      
      return uniqueChars.map((char: any) => ({
        id: char.id.toString(),
        nombre: char.name.full,
        imagenUrl: char.image.large || null,
        animeTitulo: char.media?.nodes?.[0]?.title?.romaji || null
      }));
    } catch (e) {
      console.error("Error fetching characters from AniList:", e);
      return [];
    }
  }
}
