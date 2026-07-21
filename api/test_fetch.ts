import fetch from 'node-fetch'; // or global fetch
async function test() {
  console.log('Fetching...');
  try {
    const res = await fetch('https://ramenparados.com/feed/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      timeout: 10000
    });
    const text = await res.text();
    console.log('Success, length:', text.length);
    console.log(text.substring(0, 200));
  } catch(e) {
    console.error('Failed:', e.message);
  }
}
test();
