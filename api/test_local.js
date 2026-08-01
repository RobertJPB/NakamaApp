// native fetch

async function main() {
  const res = await fetch('http://localhost:4000/api/animes/16498');
  const data = await res.json();
  console.log(data.personajes.length);
}

main().catch(console.error);
