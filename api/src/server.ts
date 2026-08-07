import './config/env'
import 'dotenv/config'
import app from './presentation/app'
import { initCronJobs } from './infrastructure/cron'

import { env } from './config/env'
import { logger } from './config/logger'

const PORT = env.PORT || 4000

// Las tareas programadas (recolección de noticias) corren fuera del proceso API
// por defecto. Para habilitarlas aquí, definir RUN_CRON=true en el entorno.
// Alternativa recomendada: desplegar `node dist/worker.js` como proceso separado.
if (env.RUN_CRON === 'true') {
  initCronJobs()
}

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
