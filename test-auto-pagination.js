fetch('http://localhost:4000/api/animes/populares?page=1&perPage=40')
  .then(async res => {
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Response array length:', json.length);
  })
  .catch(err => console.error('Error:', err.message));
