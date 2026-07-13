export const BUSCAR_ANIMES = `
  query BuscarAnimes($busqueda: String, $pagina: Int) {
    Page(page: $pagina, perPage: 50) {
      pageInfo { total currentPage lastPage }
      media(search: $busqueda, type: ANIME, sort: POPULARITY_DESC) {
        id
        title { romaji english native }
        coverImage { large }
        bannerImage
        description(asHtml: false)
        status
        episodes
        duration
        season
        seasonYear
        format
        genres
        averageScore
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`

export const DETALLE_ANIME = `
  query DetalleAnime($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      coverImage { large extraLarge }
      bannerImage
      description(asHtml: false)
      status
      episodes
      duration
      season
      seasonYear
      format
      genres
      averageScore
      popularity
      studios(isMain: true) { nodes { name } }
      characters(role: MAIN, perPage: 10) {
        nodes {
          id
          name { full native }
          image { large }
          description(asHtml: false)
        }
      }
    }
  }
`

export const ANIMES_POPULARES = `
  query AnimesPopulares($pagina: Int) {
    Page(page: $pagina, perPage: 50) {
      media(type: ANIME, sort: POPULARITY_DESC, status: RELEASING) {
        id
        title { romaji english }
        coverImage { large }
        averageScore
        episodes
        season
        seasonYear
        format
        genres
      }
    }
  }
`
