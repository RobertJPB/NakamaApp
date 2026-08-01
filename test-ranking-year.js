fetch('https://kitsu.io/api/edge/anime?sort=-averageRating&filter[seasonYear]=1900..2024&page[limit]=10')
  .then(async res => {
    const json = await res.json();
    console.log(json.data.map(a => `${a.attributes.canonicalTitle} (${a.attributes.averageRating})`).join('\n'));
  })
  .catch(err => console.error('Error:', err.message));
