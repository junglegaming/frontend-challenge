import { HttpResponse, http } from 'msw'
import { route } from '../../http/route'
import type { CreatorsService } from './service'

export function creatorsHandlers(api: string, creators: CreatorsService) {
  return [
    http.get(
      `${api}/creators`,
      route(() => HttpResponse.json(creators.list())),
    ),
    http.get<{ id: string }>(
      `${api}/creators/:id`,
      route(({ params }) => HttpResponse.json(creators.detail(params.id))),
    ),
    http.get<{ id: string }>(
      `${api}/creators/:id/nfts`,
      route(({ params }) => HttpResponse.json(creators.nfts(params.id))),
    ),
  ]
}
