fetch('http://localhost:4000/api/animes/7442')
  .then(async res => {
    const json = await res.json();
    console.log("Título:", json.anime.titulo);
    console.log("Generos:", json.anime.generos);
    console.log("Personajes:", json.personajes?.slice(0, 5).map(p => p.nombre));
  })
  .catch(err => console.error('Error:', err.message));
