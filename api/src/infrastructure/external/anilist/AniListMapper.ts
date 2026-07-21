import { Anime } from '../../../domain/entities/Anime'

function limpiarSinopsis(texto?: string) {
  if (!texto) return texto;
  let limpio = texto.split('*')[0];
  limpio = limpio.split(/(<br>\s*)*\s*\(?Source:/i)[0];
  limpio = limpio.split(/(<br>\s*)*\s*\(?Fuente:/i)[0];
  limpio = limpio.split(/(<br>\s*)*\s*\(?Note:/i)[0];
  limpio = limpio.split(/(<br>\s*)*\s*\(?Notas:/i)[0];
  return limpio.trim();
}

export function mapAniListToAnime(media: any): Partial<Anime> {
  // Extraer demografía
  const demografias = ['Shounen', 'Seinen', 'Shoujo', 'Josei']
  let demografia = media.tags?.find((t: any) => demografias.includes(t.name))?.name
  if (!demografia) {
    demografia = media.genres?.find((g: string) => demografias.includes(g))
  }

  // Extraer autor
  const authorRole = ['Original Creator', 'Story & Art', 'Art', 'Story']
  let autor = null
  if (media.staff?.edges) {
    const authorEdge = media.staff.edges.find((e: any) => authorRole.some(r => e.role?.includes(r)))
    if (authorEdge) {
      autor = authorEdge.node?.name?.full
    }
  }

  return {
    anilistId:    media.id,
    titulo:       media.title.english || media.title.romaji,
    tituloJapones: media.title.native,
    tituloRomaji: media.title.romaji,
    imagenUrl:    media.coverImage?.extraLarge || media.coverImage?.large,
    bannerUrl:    media.bannerImage,
    sinopsis:     limpiarSinopsis(media.description),
    estadoEmision: media.status,
    episodios:    media.episodes,
    duracionMin:  media.duration,
    temporada:    media.season,
    anio:         media.seasonYear,
    tipo:         media.format,
    estudio:      media.studios?.nodes?.[0]?.name,
    calificacionPromedio: media.averageScore ? media.averageScore / 10 : 0,
    autor:        autor,
    demografia:   demografia,
  }
}
