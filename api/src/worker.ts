import './config/env'
import 'dotenv/config'
import { initCronJobs } from './infrastructure/cron'
import { logger } from './config/logger'

// Worker independiente: ejecuta las tareas programadas (recolección de noticias)
// fuera del proceso de la API, para evitar duplicación con múltiples instancias
// y no bloquear el servidor web.
// Desplegar con: node dist/worker.js  (o pnpm worker en desarrollo)
logger.info('🚀 Nakama worker iniciado (cron fuera del proceso API)')
initCronJobs()
