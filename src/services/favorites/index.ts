import { api } from '@/api/client'
import { favoritesSchema, type Favorites } from '@/schemas/favorite'

export const favoriteService = {
  async list(signal?: AbortSignal): Promise<Favorites> {
    const { data } = await api.get('/favorites', { signal })
    return favoritesSchema.parse(data)
  },
  async add(nftId: string): Promise<Favorites> {
    const { data } = await api.put(`/favorites/${encodeURIComponent(nftId)}`)
    return favoritesSchema.parse(data)
  },
  async remove(nftId: string): Promise<Favorites> {
    const { data } = await api.delete(`/favorites/${encodeURIComponent(nftId)}`)
    return favoritesSchema.parse(data)
  },
}
