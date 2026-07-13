export interface Resena {
  id:               string
  usuarioId:        string
  animeId:          string
  calificacion:     number
  contenido?:       string
  contieneSpoiler:  boolean
  esPublica:        boolean
  totalLikes:       number
  creadoEn:         Date
  editadoEn?:       Date
}
