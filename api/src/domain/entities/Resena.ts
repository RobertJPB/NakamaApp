export interface Resena {
  id: string
  usuarioId: string
  animeId: string
  calificacion: number
  contenido?: string
  contieneSpoiler: boolean
  esPublica: boolean
  totalLikes: number
  fechaVisto?: Date
  etiquetas?: string[]
  creadoEn: Date
  editadoEn?: Date
  usuario?: any
  anime?: any
}
