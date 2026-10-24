import { Router } from "express"
import { prisma } from "../lib/db.js"
import { ApiError, internal } from "../lib/errors.js"

const router = Router()

// 200 only when the database answers. Missing DATABASE_URL -> 500 `missing_database_url` (lib/db.ts);
// an unreachable database -> 500 `database_unavailable` (the driver's message may carry host details: not echoed).
router.get("/", async (_req, res) => {
  try {
    await prisma().$queryRaw`SELECT 1`
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw internal("database_unavailable", "The database did not answer the health query.")
  }
  res.status(200).json({ status: "ok" })
})

export default router
