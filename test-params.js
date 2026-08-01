fetch('http://localhost:4000/api/animes/populares?page=1&perPage=21')
  .then(async res => {
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response excerpt:', text.slice(0, 300));
  })
  .catch(err => console.error('Error:', err.message));
