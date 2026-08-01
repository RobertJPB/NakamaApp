fetch('http://localhost:4000/api/animes/populares')
  .then(async res => {
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response length:', text.length);
    console.log('Response excerpt:', text.slice(0, 200));
  })
  .catch(err => console.error('Error:', err.message));
