async function getFmabRating() {
  const res = await fetch('https://kitsu.io/api/edge/anime?filter[text]=Fullmetal%20Alchemist:%20Brotherhood');
  const json = await res.json();
  if (json.data && json.data.length > 0) {
    console.log(`Rating: ${json.data[0].attributes.averageRating}`);
  } else {
    console.log('Not found');
  }
}

getFmabRating();
