import './config/env'
import 'dotenv/config'
import app from './presentation/app'
import { initCronJobs } from './infrastructure/cron'

import { env } from './config/env'
import { logger } from './config/logger'

const PORT = env.PORT || 4000

initCronJobs()

app.listen(PORT, () => {
  logger.info(`🚀 Nakama API corriendo en http://localhost:${PORT}`)
})

// Manejo de errores no controlados para evitar caídas silenciosas
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Excepción no capturada')
  // No matamos el proceso en desarrollo, en producción podríamos requerir un reinicio
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Promesa rechazada no manejada')
})
