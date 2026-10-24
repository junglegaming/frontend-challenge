import { HttpResponse, http } from 'msw'
import { field, readJson, route } from '../../http/route'
import type { MediaGenerationService } from './service'

export function mediaGenerationHandlers(api: string, media: MediaGenerationService) {
  return [
    http.post(
      `${api}/media/generate-image`,
      route(async ({ request }) => {
        const body = await readJson(request)
        return HttpResponse.json(media.generateImage(field.string(body, 'prompt')))
      }),
    ),
  ]
}
