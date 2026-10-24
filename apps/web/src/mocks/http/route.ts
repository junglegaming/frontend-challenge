import { HttpResponse, delay, type HttpResponseResolver, type PathParams } from 'msw'
import { scenarioRuntime } from '../scenarios/runtime'
import { DomainError, errorResponse, httpErrorResponse } from './errors'

type Resolver<Params extends PathParams> = (info: {
  request: Request
  params: Params
}) => Response | Promise<Response>

/**
 * Wraps a handler with the active scenario's network conditions (latency, offline, HTTP failures)
 * and translates `DomainError`s into the REST error contract. Handlers stay focused on HTTP ↔ service mapping.
 */
export function route<Params extends PathParams = PathParams>(
  resolver: Resolver<Params>,
): HttpResponseResolver<Params> {
  return async ({ request, params }) => {
    const scenario = scenarioRuntime.current
    const latency = scenarioRuntime.nextLatencyMs()
    if (latency > 0) await delay(latency)

    if (scenario.offline) return HttpResponse.error()

    const { pathname } = new URL(request.url)
    const failure = scenarioRuntime.matchFailure(request.method, pathname)
    if (failure) return httpErrorResponse(failure.status, failure.code, failure.message)

    try {
      return await resolver({ request, params })
    } catch (error) {
      if (error instanceof DomainError) return errorResponse(error)
      console.error('[mocks] unhandled error', error)
      return httpErrorResponse(500, 'INTERNAL', 'Erro interno simulado.')
    }
  }
}

/** Parses a JSON body as `unknown`; services validate the shape. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json()
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export const field = {
  string: (body: Record<string, unknown>, key: string) => (typeof body[key] === 'string' ? (body[key] as string) : ''),
  number: (body: Record<string, unknown>, key: string) => (typeof body[key] === 'number' ? (body[key] as number) : NaN),
  stringArray: (body: Record<string, unknown>, key: string) =>
    Array.isArray(body[key]) ? (body[key] as unknown[]).filter((v): v is string => typeof v === 'string') : [],
}
