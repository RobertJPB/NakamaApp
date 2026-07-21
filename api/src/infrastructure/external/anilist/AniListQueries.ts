export const BUSCAR_ANIMES = `
  query BuscarAnimes($busqueda: String, $pagina: Int) {
    Page(page: $pagina, perPage: 50) {
      pageInfo { total currentPage lastPage }
      media(search: $busqueda, type: ANIME, sort: POPULARITY_DESC) {
        id
        idMal
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
        tags { name }
        averageScore
        studios(isMain: true) { nodes { name } }
        staff(sort: RELEVANCE, perPage: 25) { edges { role node { name { full } } } }
      }
    }
  }
`

export const DETALLE_ANIME = `
  query DetalleAnime($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
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
      tags { name }
      averageScore
      popularity
      studios(isMain: true) { nodes { name } }
      staff(sort: RELEVANCE, perPage: 25) { edges { role node { name { full } } } }
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
  query AnimesPopulares($pagina: Int, $perPage: Int = 21, $genre: String, $seasonYear: Int) {
    Page(page: $pagina, perPage: $perPage) {
      media(type: ANIME, sort: POPULARITY_DESC, genre: $genre, seasonYear: $seasonYear) {
        id
        idMal
        title { romaji english }
        coverImage { extraLarge large }
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
