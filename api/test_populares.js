async function main() {
  try {
    const res = await fetch('http://127.0.0.1:4000/api/animes/populares');
    if (!res.ok) {
      console.log('Error status:', res.status);
      console.log(await res.text());
      return;
    }
    const data = await res.json();
    console.log('Success, received', data.length, 'animes');
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}
main();
