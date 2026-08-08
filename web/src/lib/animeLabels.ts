const TIPO_LABELS: Record<string, string> = {
  TV:       'Anime',
  TV_SHORT: 'Corto',
  MOVIE:    'Película',
  SPECIAL:  'Especial',
  OVA:      'OVA',
  ONA:      'ONA',
  MUSIC:    'Música',
}

export function tipoAnimeLabel(tipo?: string | null): string {
  if (!tipo) return ''
  return TIPO_LABELS[tipo.toUpperCase()] ?? tipo
}

const GENERO_MAP: Record<string, string> = {
  Action:          'Acción',
  Adventure:       'Aventura',
  Comedy:          'Comedia',
  Drama:           'Drama',
  Fantasy:         'Fantasía',
  Horror:          'Terror',
  Mystery:         'Misterio',
  Romance:         'Romance',
  'Sci-Fi':        'Ciencia Ficción',
  'Slice of Life': 'Recuentos de la vida',
  Sports:          'Deportes',
  Supernatural:    'Sobrenatural',
  Thriller:        'Suspenso',
  Psychological:   'Psicológico',
  Music:           'Música',
  'Mahou Shoujo':  'Chicas Mágicas',
  Mecha:           'Mecha',
  Ecchi:           'Ecchi',
  Kids:            'Infantil',
  Shounen:         'Shōnen',
  Shoujo:          'Shōjo',
  Josei:           'Josei',
  Seinen:          'Seinen',
}

export function traducirGenero(g: string): string {
  return GENERO_MAP[g] ?? g
}
