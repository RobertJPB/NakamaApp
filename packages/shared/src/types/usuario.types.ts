export interface UsuarioPerfil {
  id:            string
  username:      string
  nombreDisplay: string
  avatarUrl?:    string
  bannerUrl?:    string
  bio?:          string
  sitioWeb?:     string
  creadoEn:      string
  totalSeguidores: number
  totalSiguiendo:  number
  totalAnimesLista: number
  totalResenas:    number
}

export interface StatsLista {
  viendo:     number
  completados: number
  pendientes:  number
  enPausa:    number
  abandonados: number
  total:       number
  calificacionPromedioUsuario: number
}
