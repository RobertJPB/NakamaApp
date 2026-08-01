fetch('https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=5114')
  .then(async res => {
    const json = await res.json();
    console.log(json.data);
  })
  .catch(err => console.error(err));
