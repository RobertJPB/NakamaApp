import { NewsScraperService } from './src/infrastructure/services/NewsScraperService';

const scraper = new NewsScraperService();
scraper.fetchAndStoreNews()
  .then(() => { 
    console.log('Done'); 
    process.exit(0); 
  })
  .catch(console.error);
