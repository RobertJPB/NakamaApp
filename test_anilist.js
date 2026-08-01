// native fetch

const query = `
  query DetalleAnime($id: Int) {
    Media(id: $id, type: ANIME) {
      characters(sort: [ROLE, RELEVANCE, ID], perPage: 18) {
        nodes {
          id
          name { full }
        }
      }
    }
  }
`;

async function main() {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { id: 16498 } // Attack on Titan
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
