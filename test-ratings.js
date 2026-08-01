fetch('http://localhost:4000/api/animes/populares?page=1&perPage=40')
  .then(async res => {
    const json = await res.json();
    console.log(json.map(a => `${a.titulo}: ${a.calificacionPromedio}`).join('\n'));
  })
  .catch(err => console.error('Error:', err.message));
