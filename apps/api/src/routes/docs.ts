import { Router } from "express"
import { buildOpenApiDocument } from "../openapi/document.js"
import { swaggerUiHtml } from "../openapi/swagger-ui.js"

// Public documentation routes (no requireAuth), same as /health.
const router = Router()

// Machine-readable OpenAPI 3.1 document, generated from the Zod schemas.
router.get("/openapi.json", (_req, res) => {
  res.status(200).json(buildOpenApiDocument())
})

// Interactive Swagger UI (assets from CDN), pointed at ./openapi.json.
router.get("/docs", (_req, res) => {
  res.status(200).type("html").send(swaggerUiHtml())
})

export default router
