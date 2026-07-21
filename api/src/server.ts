import 'dotenv/config'
import app from './presentation/app'
import { initCronJobs } from './infrastructure/cron'

const PORT = process.env.PORT || 4000

initCronJobs()

app.listen(PORT, () => {
  console.log(`🚀 Nakama API corriendo en http://localhost:${PORT}`)
})
