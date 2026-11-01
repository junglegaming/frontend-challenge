import { accountHandlers } from './account'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { favoritesHandlers } from './favorites'
import { newsletterHandlers } from './newsletter'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'

export const handlers = [
  ...authHandlers,
  ...nftHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...accountHandlers,
  ...newsletterHandlers,
]
