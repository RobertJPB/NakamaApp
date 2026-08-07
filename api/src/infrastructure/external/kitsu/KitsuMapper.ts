import { Anime } from '../../../domain/entities/Anime'

export function mapKitsuToAnime(kitsuData: any): Partial<Anime> {
  const attrs = kitsuData.attributes || {}

  return {
    // Utilizaremos externalId ya que kitsu devuelve strings como IDs
    externalId: kitsuData.id,
    titulo:
      attrs.titles?.en ||
      attrs.titles?.en_jp ||
      attrs.titles?.en_us ||
      attrs.canonicalTitle ||
      'Sin título',
    tituloJapones: attrs.titles?.ja_jp || undefined,
    tituloRomaji: attrs.titles?.en_jp || undefined,
    imagenUrl: attrs.posterImage?.original || attrs.posterImage?.large || undefined,
    bannerUrl: attrs.coverImage?.original || attrs.coverImage?.large || undefined,
    sinopsis: attrs.synopsis || attrs.description || undefined,
    estadoEmision:
      attrs.status === 'finished'
        ? 'Terminado'
        : attrs.status === 'current'
          ? 'En Emisión'
          : attrs.status === 'tba'
            ? 'TBA'
            : attrs.status === 'unreleased' || attrs.status === 'upcoming'
              ? 'Próximamente'
              : attrs.status || undefined,
    episodios: attrs.episodeCount || undefined,
    duracionMin: attrs.episodeLength || undefined,
    anio: attrs.startDate ? new Date(attrs.startDate).getFullYear() : undefined,
    tipo: attrs.showType || undefined,
    calificacionPromedio: attrs.averageRating
      ? parseFloat((parseFloat(attrs.averageRating) / 10).toFixed(1))
      : 0,
  }
}
