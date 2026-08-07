import cron from 'node-cron'
import { NewsScraperService } from './services/NewsScraperService'

const newsScraper = new NewsScraperService()

export function initCronJobs() {
  console.log('Inicializando tareas programadas (Cron)...')

  // Ejecutar todos los días a la medianoche (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('Cron: Ejecutando recolección de noticias diarias...')
    await newsScraper.fetchAndStoreNews()
  })

  // Opcional: Ejecutar inmediatamente al inicio para pruebas (descomentar si es necesario)
  // setTimeout(() => {
  //   newsScraper.fetchAndStoreNews();
  // }, 5000);
}
