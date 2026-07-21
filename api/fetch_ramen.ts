import fs from 'fs';

async function main() {
  const res = await fetch('https://ramenparados.com/?nowprocket=1', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  fs.writeFileSync('ramen.html', html);
  console.log('Saved ramen.html');
}
main();
