fetch('https://kitsu.io/api/edge/anime?sort=-userCount&page[limit]=1&page[offset]=0', {
  headers: {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json'
  }
})
  .then(res => res.json())
  .then(data => console.log('Kitsu response keys:', Object.keys(data)))
  .catch(err => console.error('Kitsu fetch error:', err));
