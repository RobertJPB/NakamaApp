import 'dotenv/config'
import app from './presentation/app'

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`🚀 Nakama API corriendo en http://localhost:${PORT}`)
})
