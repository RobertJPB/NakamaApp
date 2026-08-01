fetch('https://kitsu.io/api/edge/anime/7442?include=characters')
  .then(async res => {
    const json = await res.json();
    console.log("Included types:", json.included?.map(inc => inc.type).join(', ') || "No included");
  })
  .catch(err => console.error('Error:', err.message));
