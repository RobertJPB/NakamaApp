const query = `
query ($search: String) {
  characters: Page(page: 1, perPage: 15) {
    characters(search: $search, sort: [FAVOURITES_DESC]) {
      id
      name { full }
      image { large }
      media(sort: POPULARITY_DESC, type: ANIME, page: 1, perPage: 1) {
        nodes {
          title { romaji }
        }
      }
    }
  }
  anime: Page(page: 1, perPage: 3) {
    media(search: $search, type: ANIME, sort: [POPULARITY_DESC]) {
      title { romaji }
      characters(sort: [FAVOURITES_DESC], page: 1, perPage: 25) {
        nodes {
          id
          name { full }
          image { large }
        }
      }
    }
  }
}
`;

fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { search: "Dragon Ball" } })
}).then(r => r.json()).then(d => {
  const chars = d.data.characters.characters;
  const animeChars = d.data.anime.media.flatMap(m => m.characters.nodes.map(c => ({...c, animeTitle: m.title.romaji})));
  
  const map = new Map();
  // Add anime characters first
  animeChars.forEach(c => map.set(c.id, c));
  // Add matching characters
  chars.forEach(c => {
    if (!map.has(c.id)) {
      map.set(c.id, { ...c, animeTitle: c.media?.nodes?.[0]?.title?.romaji });
    }
  });
  
  console.log(Array.from(map.values()).slice(0, 50).map(c => c.name.full));
});
