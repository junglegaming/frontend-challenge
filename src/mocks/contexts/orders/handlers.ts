import { HttpResponse, delay, http } from 'msw'
import { NETWORKS, type Network } from '@/domains/wallets'
import { errors } from '../../http/errors'
import { bearerToken } from '../../http/identity'
import { field, readJson, route } from '../../http/route'
import type { AuthService } from '../auth/service'
import type { OrderService } from './service'

export function orderHandlers(
  api: string,
  auth: AuthService,
  orders: OrderService,
  responseDelayMs: () => number,
) {
  return [
    http.post(
      `${api}/orders`,
      route(async ({ request }) => {
        const { userId } = auth.authenticate(bearerToken(request))
        const body = await readJson(request)
        const collector = typeof body.collector === 'object' && body.collector !== null ? (body.collector as Record<string, unknown>) : {}
        const network = field.string(body, 'network')
        if (!(NETWORKS as readonly string[]).includes(network)) throw errors.validation({ network: 'Selecione uma rede.' })

        const { order, replayed } = orders.create(userId, request.headers.get('Idempotency-Key') ?? '', {
          quoteSignature: field.string(body, 'quoteSignature'),
          network: network as Network,
          walletId: field.string(body, 'walletId'),
          collector: {
            fullName: field.string(collector, 'fullName'),
            email: field.string(collector, 'email'),
            country: field.string(collector, 'country'),
            note: field.string(collector, 'note') || undefined,
          },
        })
        // Timeout scenario: the order is already persisted, but the response arrives too late.
        const lag = replayed ? 0 : responseDelayMs()
        if (lag > 0) await delay(lag)
        return HttpResponse.json(order, { status: replayed ? 200 : 201, headers: { 'Idempotent-Replayed': String(replayed) } })
      }),
    ),

    http.get<{ orderId: string }>(
      `${api}/orders/:orderId`,
      route(({ request, params }) =>
        HttpResponse.json(orders.get(auth.authenticate(bearerToken(request)).userId, params.orderId)),
      ),
    ),
  ]
}
