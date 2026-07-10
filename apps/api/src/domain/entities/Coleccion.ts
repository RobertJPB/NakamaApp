export interface Coleccion {
  id:            string
  usuarioId?:    string
  titulo:        string
  descripcion?:  string
  imagenUrl?:    string
  esEditorial:   boolean
  esPublica:     boolean
  totalAnimes:   number
  creadoEn:      Date
  actualizadoEn: Date
}
