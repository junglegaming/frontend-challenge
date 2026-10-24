import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import { coinsRouter } from './routes/coins.js'
import { identity } from './middleware/identity.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))
  app.use(express.json())
  app.use(identity)
  app.use('/coins', coinsRouter)

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error('[coins-server] unhandled error', err)
    res.status(500).json({ error: 'internal_error' })
  }
  app.use(errorHandler)

  return app
}
