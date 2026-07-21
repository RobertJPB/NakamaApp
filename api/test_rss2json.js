async function fetchRss() {
  try {
    const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Framenparados.com%2Ffeed%2F');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2).substring(0, 500));
  } catch (e) {
    console.error('Failed:', e);
  }
}
fetchRss();
