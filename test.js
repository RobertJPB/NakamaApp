const fetch = require('node-fetch'); // or native fetch in node 18+

async function testKitsu() {
  const q = "Dragon Ball";
  const url = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(q)}&include=characters.character&page[limit]=1`;
  
  const res = await fetch(url);
  const json = await res.json();
  
  if (!json.included) {
    console.log("No included data");
    return;
  }
  
  const characters = json.included
    .filter(inc => inc.type === 'characters')
    .map(c => c.attributes.canonicalName || c.attributes.name);
    
  console.log(characters.slice(0, 50));
}

testKitsu();
