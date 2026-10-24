import cors from "cors"
import express, { Router } from "express"
import { errorMiddleware, notFound } from "./lib/errors.js"
import adminRouter from "./routes/admin.js"
import authRouter from "./routes/auth.js"
import coinsRouter from "./routes/coins.js"
import docsRouter from "./routes/docs.js"
import healthRouter from "./routes/health.js"

const app = express()

app.use(cors())
app.use(express.json())

// Vercel's rewrite (`/api/(.*)` -> `/api/index`) keeps the original request path,
// so the function sees `/api/...`; mounting here makes `dev:local` match it too.
const api = Router()
api.use("/health", healthRouter)
api.use("/auth", authRouter)
api.use("/coins", coinsRouter)
api.use("/admin", adminRouter)
// Public API documentation (/api/openapi.json, /api/docs) — mounted before the
// catch-all so unknown paths still fall through to the 404 handler below.
api.use(docsRouter)
app.use("/api", api)

app.use((req, _res, next) => {
  next(notFound("route_not_found", `No route for ${req.method} ${req.path}`))
})

app.use(errorMiddleware)

export default app
