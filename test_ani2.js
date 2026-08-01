const q = `
  query BuscarPersonajes($busqueda: String, $pagina: Int) {
    Page(page: $pagina, perPage: 15) {
      characters(search: $busqueda, sort: FAVOURITES_DESC) {
        id
        name { full native userPreferred }
        image { large medium }
        media(type: ANIME, perPage: 1, sort: POPULARITY_DESC) {
          nodes {
            id
            title { romaji english }
          }
        }
      }
    }
    AnimePage: Page(page: 1, perPage: 1) {
      media(search: $busqueda, type: ANIME, sort: POPULARITY_DESC) {
        id
        title { romaji english }
        characters(page: $pagina, perPage: 25, sort: ROLE_DESC) {
          nodes {
            id
            name { full native userPreferred }
            image { large medium }
          }
        }
      }
    }
  }
`;

fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: q, variables: { busqueda: 'goku', pagina: 1 } })
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)));
