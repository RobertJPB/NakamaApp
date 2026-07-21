import fs from 'fs';
import path from 'path';

async function downloadImage(url, filename) {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filename, buffer);
  console.log(`Saved ${filename}`);
}

async function main() {
  const publicDir = path.join(__dirname, '../web/public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const images = [
    'https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-gY1aT6s1kEOn.jpg',
    'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSzYynkHJf.jpg',
    'https://s4.anilist.co/file/anilistcdn/media/anime/banner/166240-5L8jGfJ1rF7B.jpg',
    'https://s4.anilist.co/file/anilistcdn/media/anime/banner/166531-uVn2b7vLzN5Q.jpg',
    'https://s4.anilist.co/file/anilistcdn/media/anime/banner/127230-hOJoE9O2eWqM.jpg',
    'https://s4.anilist.co/file/anilistcdn/media/anime/banner/140270-13D9RIfXNf7b.jpg'
  ];

  for (let i = 0; i < images.length; i++) {
    await downloadImage(images[i], path.join(publicDir, `news${i+1}.jpg`));
  }
}
main();
