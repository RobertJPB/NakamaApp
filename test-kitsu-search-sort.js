const url = "https://kitsu.io/api/edge/anime?filter[text]=evangelion&sort=-userCount&page[limit]=10";
fetch(url)
  .then(res => res.json())
  .then(data => {
    data.data.forEach(anime => {
      console.log(anime.attributes.canonicalTitle, anime.attributes.userCount);
    });
  })
  .catch(err => console.error(err));
