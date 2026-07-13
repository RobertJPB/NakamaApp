import { Anime } from '../../../domain/entities/Anime'

export function mapAniListToAnime(media: any): Partial<Anime> {
  return {
    anilistId:    media.id,
    titulo:       media.title.english || media.title.romaji,
    tituloJapones: media.title.native,
    tituloRomaji: media.title.romaji,
    imagenUrl:    media.coverImage?.large || media.coverImage?.extraLarge,
    bannerUrl:    media.bannerImage,
    sinopsis:     media.description,
    estadoEmision: media.status,
    episodios:    media.episodes,
    duracionMin:  media.duration,
    temporada:    media.season,
    anio:         media.seasonYear,
    tipo:         media.format,
    estudio:      media.studios?.nodes?.[0]?.name,
  }
}
