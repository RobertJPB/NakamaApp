async function getAnilistRating() {
  const query = `query { Media(search: "Fullmetal Alchemist: Brotherhood", type: ANIME) { id title { romaji } averageScore } }`;
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

getAnilistRating();
