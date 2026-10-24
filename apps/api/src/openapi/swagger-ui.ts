// Swagger UI is loaded from a public CDN (pinned version) instead of being
// bundled into the function — this keeps the Vercel function light and avoids
// the known pitfalls of serving swagger-ui-express static assets behind the
// `/api/*` rewrite (research.md D4). No npm dependency is added.
const SWAGGER_UI_VERSION = "5.17.14"
const CDN = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}`

/**
 * Minimal HTML page that renders Swagger UI against `./openapi.json`.
 *
 * Served at `GET /api/docs`; the relative `./openapi.json` resolves to
 * `/api/openapi.json` under the Vercel rewrite, so it works identically in
 * `vercel dev`, the local listener, and production.
 */
export function swaggerUiHtml(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>apps/api — API Docs</title>
    <link rel="stylesheet" href="${CDN}/swagger-ui.css" />
    <style>
      body { margin: 0; background: #fafafa; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${CDN}/swagger-ui-bundle.js" crossorigin></script>
    <script src="${CDN}/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "./openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
      });
    </script>
  </body>
</html>
`
}
