async function search(title) {
  const res = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(title)}`);
  const json = await res.json();
  if (json.data && json.data.length > 0) {
    console.log(`${title} => ID: ${json.data[0].id}, Kitsu Title: ${json.data[0].attributes.canonicalTitle}`);
  } else {
    console.log(`${title} => Not found`);
  }
}
async function main() {
  await search('Fullmetal Alchemist: Brotherhood');
  await search('Steins;Gate');
  await search('Frieren: Beyond Journey');
  await search('Kimetsu no Yaiba');
  await search('Attack on Titan');
  await search('Hunter x Hunter (2011)');
  await search('Jujutsu Kaisen 2');
  await search('Violet Evergarden');
  await search('Vinland Saga');
  await search('Made in Abyss');
}
main();
