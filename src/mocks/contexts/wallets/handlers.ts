import { HttpResponse, http } from 'msw'
import { bearerToken } from '../../http/identity'
import { field, readJson, route } from '../../http/route'
import type { AuthService } from '../auth/service'
import { parseWalletInput, type WalletService } from './service'

export function walletHandlers(api: string, auth: AuthService, wallets: WalletService) {
  const userOf = (request: Request) => auth.authenticate(bearerToken(request)).userId

  return [
    http.get(`${api}/wallets`, route(({ request }) => HttpResponse.json(wallets.list(userOf(request))))),

    http.post(
      `${api}/wallets`,
      route(async ({ request }) => {
        const userId = userOf(request)
        return HttpResponse.json(wallets.create(userId, parseWalletInput(await readJson(request))), { status: 201 })
      }),
    ),

    http.put<{ walletId: string }>(
      `${api}/wallets/:walletId`,
      route(async ({ request, params }) => {
        const userId = userOf(request)
        return HttpResponse.json(wallets.update(userId, params.walletId, parseWalletInput(await readJson(request))))
      }),
    ),

    http.post<{ walletId: string }>(
      `${api}/wallets/:walletId/connect`,
      route(async ({ request, params }) => {
        const userId = userOf(request)
        const body = await readJson(request)
        return HttpResponse.json(wallets.connect(userId, params.walletId, field.string(body, 'network')))
      }),
    ),
  ]
}
