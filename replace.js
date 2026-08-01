const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('.next')) {
        replaceInDir(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content
        .replace(/anilistId/g, 'externalId')
        .replace(/animeAnilistId/g, 'externalId')
        .replace(/AnilistId/g, 'ExternalId')
        .replace(/externalId:\s*number/g, 'externalId: string');
        
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'web', 'src'));
replaceInDir(path.join(__dirname, 'packages', 'shared', 'src'));
replaceInDir(path.join(__dirname, 'api', 'src'));
