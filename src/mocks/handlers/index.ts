import { accountHandlers } from './account'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { favoriteHandlers } from './favorites'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'

export const handlers = [...authHandlers, ...nftHandlers, ...favoriteHandlers, ...cartHandlers, ...orderHandlers, ...accountHandlers]
