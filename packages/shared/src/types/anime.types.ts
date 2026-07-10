export interface AnimeResumen {
  anilistId:   number
  titulo:      string
  imagenUrl?:  string
  tipo?:       string
  temporada?:  string
  anio?:       number
  calificacionPromedio: number
}

export interface AnimeDetalle extends AnimeResumen {
  tituloJapones?: string
  tituloRomaji?:  string
  bannerUrl?:     string
  sinopsis?:      string
  estadoEmision?: string
  episodios?:     number
  duracionMin?:   number
  estudio?:       string
  generos?:       string[]
  demografias?:   string[]
  totalResenas:   number
  totalEnListas:  number
}

export type EstadoLista = 'viendo' | 'completado' | 'pendiente' | 'en_pausa' | 'abandonado'
