const fetch = require('node-fetch');
const q = `query DetalleAnime { Media(id: 2890, type: ANIME) { id title { romaji english native } coverImage { large extraLarge } bannerImage description(asHtml: false) status episodes duration season seasonYear format genres averageScore popularity studios(isMain: true) { nodes { name } } characters(role: MAIN, perPage: 10) { nodes { id name { full native } image { large } description(asHtml: false) } } } }`;

fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: q })
}).then(r => r.json()).then(r => console.dir(r, {depth: null}));
