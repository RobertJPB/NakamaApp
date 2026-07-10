export interface Usuario {
  id:              string
  email:           string
  username:        string
  nombreDisplay:   string
  avatarUrl?:      string
  bannerUrl?:      string
  bio?:            string
  sitioWeb?:       string
  perfilPrivado:   boolean
  resenasPublicas: boolean
  listasPublicas:  boolean
  creadoEn:        Date
  actualizadoEn:   Date
  ultimoAcceso?:   Date
}
