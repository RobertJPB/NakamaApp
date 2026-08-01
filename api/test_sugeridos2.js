const axios = require('axios');
axios.get('http://localhost:4000/api/usuarios/sugeridos')
  .then(res => console.log('Data:', res.data))
  .catch(err => console.error('Error:', err.response ? err.response.data : err.message));
