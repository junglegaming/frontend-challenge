import { Router } from "express"
import { z } from "zod"
import { loginRequestSchema, ownerIdParamSchema } from "../domains/admin/contracts.js"
import * as adminService from "../domains/admin/service.js"
import * as coinsService from "../domains/coins/service.js"
import { requireAdmin, signAdminToken } from "../lib/auth.js"
import { badRequest, unauthorized } from "../lib/errors.js"

const router = Router()

router.post("/login", async (req, res) => {
  const parsed = loginRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    throw badRequest("invalid_login_request", "email (valid) and password are required.")
  }

  const admin = await adminService.authenticateAdmin(parsed.data.email, parsed.data.password)
  if (!admin) {
    // Same answer for an unknown e-mail and a wrong password.
    throw unauthorized("invalid_credentials", "E-mail or password is incorrect.")
  }

  const { token, expiresAt } = signAdminToken(admin.id)
  res.status(200).json({ token, expiresAt, admin: { id: admin.id, email: admin.email } })
})

router.use(requireAdmin)

router.get("/me", (req, res) => {
  res.status(200).json({ id: req.adminId, role: "admin" })
})

const ownersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  cursor: z.string().min(1).max(2048).optional(),
})

router.get("/owners", async (req, res) => {
  const parsed = ownersQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    throw badRequest("invalid_query", "limit MUST be an integer between 1 and 200; cursor MUST be a non-empty string.")
  }
  const { owners, cursor } = await adminService.listOwners(parsed.data.limit, parsed.data.cursor)
  res.status(200).json({ owners, cursor })
})

router.get("/owners/:ownerId", async (req, res) => {
  const ownerId = ownerIdParamSchema.safeParse(req.params.ownerId)
  if (!ownerId.success) {
    throw badRequest("invalid_owner_id", "ownerId MUST match [A-Za-z0-9_.-] and have at most 128 characters.")
  }
  const [balance, transactions] = await Promise.all([
    coinsService.getBalance(ownerId.data),
    coinsService.listTransactions(ownerId.data, 50),
  ])
  res.status(200).json({ balance, transactions })
})

export default router
