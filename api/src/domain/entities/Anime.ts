export interface Anime {
  id:                  string
  anilistId:           number
  titulo:              string
  tituloJapones?:      string
  tituloRomaji?:       string
  imagenUrl?:          string
  bannerUrl?:          string
  sinopsis?:           string
  estadoEmision?:      string
  episodios?:          number
  duracionMin?:        number
  temporada?:          string
  anio?:               number
  tipo?:               string
  estudio?:            string
  calificacionPromedio: number
  totalResenas:        number
  totalEnListas:       number
  creadoEn:            Date
  actualizadoEn:       Date
}
