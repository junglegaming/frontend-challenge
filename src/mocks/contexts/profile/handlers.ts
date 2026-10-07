import { HttpResponse, http } from 'msw'
import { bearerToken } from '../../http/identity'
import { field, readJson, route } from '../../http/route'
import type { AuthService } from '../auth/service'
import type { ProfileService } from './service'

export function profileHandlers(api: string, auth: AuthService, profile: ProfileService) {
  const userOf = (request: Request) => auth.authenticate(bearerToken(request)).userId

  return [
    http.get(`${api}/profile`, route(({ request }) => HttpResponse.json(profile.get(userOf(request))))),

    http.patch(
      `${api}/profile`,
      route(async ({ request }) => {
        const userId = userOf(request)
        const body = await readJson(request)
        return HttpResponse.json(
          profile.update(userId, {
            name: field.string(body, 'name'),
            username: field.string(body, 'username'),
            email: field.string(body, 'email'),
            bio: field.string(body, 'bio'),
          }),
        )
      }),
    ),

    http.put(
      `${api}/profile/avatar`,
      route(async ({ request }) => {
        const userId = userOf(request)
        const body = await readJson(request)
        return HttpResponse.json(profile.updateAvatar(userId, field.string(body, 'dataUrl')))
      }),
    ),

    http.post(
      `${api}/profile/password`,
      route(async ({ request }) => {
        const userId = userOf(request)
        const body = await readJson(request)
        await profile.changePassword(userId, field.string(body, 'currentPassword'), field.string(body, 'newPassword'))
        return new HttpResponse(null, { status: 204 })
      }),
    ),
  ]
}
