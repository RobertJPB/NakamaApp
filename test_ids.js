async function test() {
  const query = `query { Media(id: 101922, type: ANIME) { id title { romaji } } }`;
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  console.log(await res.json());
}
test();
