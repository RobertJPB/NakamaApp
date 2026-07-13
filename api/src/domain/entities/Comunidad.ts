export type TipoComunidad = 'anime' | 'genero' | 'temporada'
export type RolMiembro   = 'admin' | 'moderador' | 'miembro'

export interface Comunidad {
  id:            string
  nombre:        string
  descripcion?:  string
  imagenUrl?:    string
  bannerUrl?:    string
  tipo:          TipoComunidad
  referenciaId?: string
  esOficial:     boolean
  totalMiembros: number
  creadoPor?:    string
  creadoEn:      Date
}
