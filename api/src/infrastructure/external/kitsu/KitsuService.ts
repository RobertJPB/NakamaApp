import { IAnimeExternalService } from '../../../application/interfaces/IAnimeExternalService'
import { mapKitsuToAnime } from './KitsuMapper'
import { Anime } from '../../../domain/entities/Anime'

const KITSU_URL = 'https://kitsu.io/api/edge'

// Cache para notas MAL: kitsuId -> { score, timestamp }
const malScoreCache = new Map<string, { score: number; ts: number }>()
const MAL_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

// Cache general para respuestas de API (búsquedas y populares)
const responseCache = new Map<string, { data: any; ts: number }>()
const RESPONSE_CACHE_TTL = 60 * 60 * 1000 // 1 hora

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
    
    const cacheKey = `search_${query}_${pagina}_${perPage}`
    const cached = responseCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < RESPONSE_CACHE_TTL) {
      return cached.data
    }
    
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

    const result = {
      pageInfo: {
        total: data.meta?.count || 0,
        currentPage: pagina,
        lastPage: Math.ceil((data.meta?.count || 0) / limit)
      },
      animes
    }

    responseCache.set(cacheKey, { data: result, ts: Date.now() })
    return result
  }

  async obtenerDetalle(externalId: string) {
    // Primero obtenemos la data base del anime con géneros
    const data = await this.fetchKitsu(`/anime/${externalId}?include=categories,characters,characters.character`)
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

    // Kitsu devuelve los personajes en el array 'included' con type 'characters'
    // El include correcto es 'characters.character' para traer la data del personaje
    const personajes = included
      .filter((inc: any) => inc.type === 'characters' || inc.type === 'anime-characters')
      .map((char: any) => ({
        id: char.id,
        nombre: char.attributes?.names?.en || char.attributes?.canonicalName || char.attributes?.name || 'Desconocido',
        imagenUrl: char.attributes?.image?.original || char.attributes?.image?.large || null
      }))
      .filter((p: any) => p.imagenUrl); // Solo los que tienen imagen

    if (personajes.length > 0) {
      const namesToTranslate = personajes.map((p: any) => p.nombre).join(' | ');
      const translatedNamesStr = await translateText(namesToTranslate);
      const translatedNamesArr = translatedNamesStr.split('|').map((s: string) => s.trim());
      
      personajes.forEach((p: any, index: number) => {
        if (translatedNamesArr[index]) {
          p.nombre = translatedNamesArr[index].replace(/(^[\s,]+|[\s,]+$)/g, '');
        }
      });
    } else {
      // Fallback a Jikan (API pública de MAL) cuando Kitsu no tiene personajes
      try {
        // Usar el endpoint de relaciones /anime/{id}/mappings (más fiable que filter[item_id])
        const mappingRes = await fetch(
          `${KITSU_URL}/anime/${externalId}/mappings`,
          { headers: { 'Accept': 'application/vnd.api+json' } }
        )
        if (mappingRes.ok) {
          const mappingData = await mappingRes.json() as any
          const malMapping = (mappingData.data || []).find(
            (m: any) => m.attributes?.externalSite === 'myanimelist/anime'
          )
          const malId = malMapping?.attributes?.externalId
          if (malId) {
            console.log(`[KitsuService] Fetching characters from Jikan for MAL ID: ${malId}`)
            const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}/characters`)
            if (jikanRes.ok) {
              const jikanData = await jikanRes.json() as any
              const jikanChars = (jikanData.data || [])
                .filter((entry: any) => entry.character?.images?.webp?.image_url || entry.character?.images?.jpg?.image_url)
                .slice(0, 20)
              jikanChars.forEach((entry: any) => {
                personajes.push({
                  id: entry.character.mal_id.toString(),
                  nombre: entry.character.name || 'Desconocido',
                  imagenUrl: entry.character.images?.webp?.image_url || entry.character.images?.jpg?.image_url
                })
              })
              console.log(`[KitsuService] Got ${personajes.length} characters from Jikan`)
            }
          }
        }
      } catch (err) {
        console.error('Jikan character fallback error:', err)
      }
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
    
    const cacheKey = `populares_${pagina}_${perPage}_${genre || 'all'}_${seasonYear || 'all'}`
    const cached = responseCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < RESPONSE_CACHE_TTL) {
      return cached.data
    }

    let url = `/anime?sort=-userCount`
    if (genre) url += `&filter[categories]=${encodeURIComponent(genre)}`
    if (seasonYear) url += `&filter[seasonYear]=${seasonYear}`

    const data = await this.fetchKitsuPaginated(url, limit, offset)
    const animes = (data.data || []).map(mapKitsuToAnime)

    responseCache.set(cacheKey, { data: animes, ts: Date.now() })
    return animes
  }

  async buscarPersonajes(busqueda: string) {
    try {
      // Usamos Jikan (API pública de MAL) — sin restricciones comerciales
      const res = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(busqueda)}&limit=15&order_by=favorites&sort=desc`)
      if (!res.ok) return []
      const json = await res.json() as any
      
      return (json.data || [])
        .filter((c: any) => c.images?.webp?.image_url || c.images?.jpg?.image_url)
        .map((c: any) => ({
          id: c.mal_id.toString(),
          nombre: c.name || 'Desconocido',
          imagenUrl: c.images?.webp?.image_url || c.images?.jpg?.image_url || null,
          animeTitulo: c.anime?.[0]?.anime?.title || null
        }))
    } catch (e) {
      console.error('Error fetching characters from Jikan:', e)
      return []
    }
  }
}
