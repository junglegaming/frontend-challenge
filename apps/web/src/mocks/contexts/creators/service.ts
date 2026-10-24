import { toSummary } from '../catalog/service'
import { errors } from '../../http/errors'
import type { CreatorsRepository } from './repository'

export class CreatorsService {
  private readonly repository: CreatorsRepository

  constructor(repository: CreatorsRepository) {
    this.repository = repository
  }

  list() {
    return this.repository.all()
  }

  detail(id: string) {
    const creator = this.repository.findById(id)
    if (!creator) throw errors.notFound('Criador')
    return creator
  }

  nfts(id: string) {
    return this.repository.nftsByArtist(id).map(toSummary)
  }
}
