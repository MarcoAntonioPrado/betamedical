import { app } from './app.js'
import { env } from './env.js'

app.listen(env.PORT, () => {
  console.log(`[atlasmed-backend] API pronta em http://localhost:${env.PORT} no modo ${env.APP_MODE}`)
})