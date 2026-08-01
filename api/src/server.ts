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
