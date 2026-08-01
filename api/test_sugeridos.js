fetch('http://localhost:4000/api/usuarios/sugeridos')
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);
