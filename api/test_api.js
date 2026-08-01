fetch('http://localhost:4000/api/ranking/mas-vistos?limit=100')
  .then(res => res.json())
  .then(data => console.log("Mas Vistos:", JSON.stringify(data, null, 2)))
  .catch(err => console.error("Error:", err.message));
