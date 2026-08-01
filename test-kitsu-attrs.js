fetch('https://kitsu.io/api/edge/anime/7442')
  .then(async res => {
    const json = await res.json();
    console.log(Object.keys(json.data.attributes));
  })
  .catch(err => console.error('Error:', err.message));
