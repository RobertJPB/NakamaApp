fetch('https://kitsu.io/api/edge/anime/7442?include=categories,characters.character')
  .then(async res => {
    const json = await res.json();
    console.log("Included types:", Array.from(new Set(json.included?.map(inc => inc.type))).join(', '));
    const chars = json.included?.filter(i => i.type === 'characters').slice(0, 2);
    console.log("Sample characters:", chars?.map(c => c.attributes.name));
    const cats = json.included?.filter(i => i.type === 'categories').slice(0, 2);
    console.log("Sample categories:", cats?.map(c => c.attributes.title));
  })
  .catch(err => console.error('Error:', err.message));
