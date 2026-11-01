export { http } from 'msw/core/http'

/** Resposta JSON sem carregar o entrypoint completo do MSW no browser. */
export function json<T>(body: T, init?: ResponseInit): Response {
  return Response.json(body, init)
}

/** Espera assíncrona usada pelos atrasos simulados. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
