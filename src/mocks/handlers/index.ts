/**
 * MSW request handlers for the NFT Marketplace API.
 *
 * Centralized collection of all MSW request handlers organized by feature area.
 * Handlers define mock responses for API endpoints including:
 * - NFT catalog operations
 * - Authentication flows
 * - Favorites management
 * - Cart management
 * - Quotes and coupons
 * - Order processing
 * - Profile and wallet operations
 * - Error scenario handlers
 *
 * @module mocks/handlers
 * @see src/shared/api/api-types - Type definitions handlers reference
 * @see src/mocks/state/mock-state.ts - Shared mock state
 * @see src/mocks/fixtures/index.ts - Fixture data sources
 */

import type { MSWRequestHandler } from 'msw'
import type {
  NftSummary,
  UserSummary,
  CartItem,
  OrderSummary,
  ApiResponse,
  ApiErrorResponse
} from '../shared/api/api-types'
import type { MockState, mockStateUtils } from '../state/mock-state'

/** All MSW request handlers exported for use in server/browser */
export const handlers: MSWRequestHandler[] = [
  /** ==================== NFT CATALOG HANDLERS ==================== */

  /** GET /api/nfts - List NFTs with pagination, search, filters */
  {
    method: 'GET',
    path: '/api/nfts',
    handler: async (req, res, ctx) => {
      const {
        page = '1',
        limit = '20',
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        minPrice,
        maxPrice
      } = req.query

      const pageNum = parseInt(page as string, 10)
      const limitNum = parseInt(limit as string, 10)
      const offset = (pageNum - 1) * limitNum

      let results = [...nftAvailable] as NftSummary[]

      // Apply search filter
      if (search) {
        results = results.filter(
          (nft) =>
            nft.title.toLowerCase().includes(search.toLowerCase()) ||
            nft.description.toLowerCase().includes(search.toLowerCase())
        )
      }

      // Apply price filters
      if (minPrice) {
        results = results.filter((nft) => nft.price >= minPrice)
      }
      if (maxPrice) {
        results = results.filter((nft) => nft.price <= maxPrice)
      }

      // Apply sorting
      results.sort((a, b) => {
        const aVal = a[sortBy as keyof NftSummary]
        const bVal = b[sortBy as keyof NftSummary]
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }
        return 0
      })

      // Apply pagination
      const paginated = results.slice(offset, offset + limitNum)

      const total = results.length

      return res(
        ctx.json<ApiResponse<NftSummary>>({
          data: paginated,
          meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** GET /api/nfts/:nftId - Get NFT detail */
  {
    method: 'GET',
    path: '/api/nfts/:nftId',
    handler: async (req, res, ctx) => {
      const { nftId } = req.params

      const nft = nftAvailable.find((n) => n.id === nftId) ||
        nftSoldOut.find((n) => n.id === nftId)

      if (!nft) {
        return res(
          ctx.status(404),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.ResourceNotFound,
              message: 'NFT not found',
              type: 'not_found'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      return res(
        ctx.json<ApiResponse<NftSummary>>({
          data: { ...nft, stats: nft.stats || { viewCount: 0, bidCount: 0, floorPrice: '0' } },
          meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** ==================== AUTHENTICATION HANDLERS ==================== */

  /** POST /api/auth/register */
  {
    method: 'POST',
    path: '/api/auth/register',
    handler: async (req, res, ctx) => {
      const { username, email, password, walletAddress } = await req.json()

      // Check for duplicate email
      if (userAlice.address.includes(email.split('@')[0]) || userBob.address.includes(email.split('@')[0])) {
        return res(
          ctx.status(409),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.DuplicateEmail,
              message: 'This email is already registered.',
              type: 'validation'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      const newUser: UserSummary = {
        id: 'user-new',
        address: walletAddress || '0x' + Math.random().toString(36).substring(2, 15),
        username,
        avatar: null,
        walletCount: 0,
        totalVolume: '0',
        isVerified: false
      }

      ;(mockStateUtils as any).setUser(newUser)

      const session: AuthSession = {
        user: newUser,
        accessToken: 'token-' + Math.random().toString(36).substring(2, 20),
        refreshToken: 'refresh-' + Math.random().toString(36).substring(2, 20),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      return res(
        ctx.json<ApiResponse<AuthSession>>({
          data: session,
          meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** POST /api/auth/login */
  {
    method: 'POST',
    path: '/api/auth/login',
    handler: async (req, res, ctx) => {
      const { email, password } = await req.json()

      // Validate credentials - check against known users
      const user = userAlice.username === email || userBob.username === email
        ? email.includes('alice') ? { ...userAlice, id: 'user-alice' } : { ...userBob, id: 'user-bob' }
        : null

      if (!user) {
        return res(
          ctx.status(401),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.InvalidCredentials,
              message: 'Invalid email or password.',
              type: 'unauthorized'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      ;(mockStateUtils as any).setUser(user, 'token-alice-session')

      const session: AuthSession = {
        user,
        accessToken: 'token-' + Math.random().toString(36).substring(2, 20),
        refreshToken: 'refresh-' + Math.random().toString(36).substring(2, 20),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      return res(
        ctx.json<ApiResponse<AuthSession>>({
          data: session,
          meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** GET /api/auth/session */
  {
    method: 'GET',
    path: '/api/auth/session',
    handler: async (req, res, ctx) => {
      const isAuth = mockStateUtils.isAuthenticated()

      if (!isAuth) {
        return res(
          ctx.status(401),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.SessionExpired,
              message: 'Your session has expired. Please log in again.',
              type: 'unauthorized'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      const user = mockStateUtils.getCurrentUser()!
      const token = localStorage.getItem('accessToken') || 'token-test'

      const session: AuthSession = {
        user,
        accessToken: token,
        refreshToken: 'refresh-test',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      return res(
        ctx.json<ApiResponse<AuthSession>>({
          data: session,
          meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** POST /api/auth/logout */
  {
    method: 'POST',
    path: '/api/auth/logout',
    handler: async (req, res, ctx) => {
      ;(mockStateUtils as any).setUser(null)

      return res(
        ctx.json({
          success: true,
          data: null,
          meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** ==================== FAVORITES HANDLERS ==================== */

  /** GET /api/favorites */
  {
    method: 'GET',
    path: '/api/favorites',
    handler: async (req, res, ctx) => {
      const isAuth = mockStateUtils.isAuthenticated()

      if (!isAuth) {
        return res(
          ctx.status(401),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.NotAuthenticated,
              message: 'You are not authorized to perform this action.',
              type: 'unauthorized'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      const favorites = mockStateUtils.getMockState().favorites.map(id => ({
        id,
        isFavorite: true
      }))

      return res(
        ctx.json<ApiResponse<{ favorites: { id: string; isFavorite: boolean }[] }>>({
          data: { favorites },
          meta: { page: 1, limit: 100, total: favorites.length, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** POST /api/favorites/:nftId */
  {
    method: 'POST',
    path: '/api/favorites/:nftId',
    handler: async (req, res, ctx) => {
      const { nftId } = req.params
      const isAuth = mockStateUtils.isAuthenticated()

      if (!isAuth) {
        return res(
          ctx.status(401),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.NotAuthenticated,
              message: 'Authentication required.',
              type: 'unauthorized'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      const currentFavorites = mockStateUtils.toggleFavorite(nftId)

      return res(
        ctx.json<ApiResponse<{ favorites: string[] }>>({
          data: { favorites: currentFavorites },
          meta: { page: 1, limit: 100, total: currentFavorites.length, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** DELETE /api/favorites/:nftId */
  {
    method: 'DELETE',
    path: '/api/favorites/:nftId',
    handler: async (req, res, ctx) => {
      const { nftId } = req.params
      const isAuth = mockStateUtils.isAuthenticated()

      if (!isAuth) {
        return res(
          ctx.status(401),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.NotAuthenticated,
              message: 'Authentication required.',
              type: 'unauthorized'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      const currentFavorites = mockStateUtils.toggleFavorite(nftId)

      return res(
        ctx.json<ApiResponse<{ favorites: string[] }>>({
          data: { favorites: currentFavorites },
          meta: { page: 1, limit: 100, total: currentFavorites.length, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** ==================== CART HANDLERS ==================== */

  /** GET /api/cart */
  {
    method: 'GET',
    path: '/api/cart',
    handler: async (req, res, ctx) => {
      const isAuth = mockStateUtils.isAuthenticated()
      const cart = mockStateUtils.getMockState().cart

      if (!isAuth) {
        // Return cart as-is for anonymous users
        return res(
          ctx.json<ApiResponse<CartItem[]>>({
            data: cart,
            meta: { page: 1, limit: 100, total: cart.length, totalPages: 1 },
            success: true,
            requestId: 'req-' + Date.now(),
            timestamp: new Date().toISOString()
          })
        )
      }

      return res(
        ctx.json<ApiResponse<CartItem[]>>({
          data: cart,
          meta: { page: 1, limit: 100, total: cart.length, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** POST /api/cart/items */
  {
    method: 'POST',
    path: '/api/cart/items',
    handler: async (req, res, ctx) => {
      const { nftId, quantity } = await req.json()
      const isAuth = mockStateUtils.isAuthenticated()

      if (!isAuth) {
        return res(
          ctx.status(401),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.NotAuthenticated,
              message: 'Authentication required to add to cart.',
              type: 'unauthorized'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      // Check NFT availability
      const nftAvailableCheck = mockStateUtils.isNftAvailable(nftId)
      if (!nftAvailableCheck) {
        return res(
          ctx.status(400),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.ItemNotAvailable,
              message: 'This NFT is no longer available.',
              type: 'validation'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      // Check maximum quantity (max 1 per NFT for simplicity)
      const currentCart = mockStateUtils.getMockState()
      const existingIndex = currentCart.cart.findIndex((item) => item.nftId === nftId)

      if (existingIndex >= 0 && currentCart.cart[existingIndex].quantity >= 1) {
        return res(
          ctx.status(409),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.IdempotencyKeyConflict,
              message: 'This NFT is already in your cart. Maximum quantity is 1.',
              type: 'conflict'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      // Get NFT price from available catalog
      const nft = nftAvailable.find((n) => n.id === nftId)
      const price = nft ? nft.price : '0'

      mockStateUtils.addToCart(nftId, price, quantity || 1)

      const updatedCart = mockStateUtils.getMockState().cart

      return res(
        ctx.json<ApiResponse<CartItem[]>>({
          data: updatedCart,
          meta: { page: 1, limit: 100, total: updatedCart.length, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** PATCH /api/cart/items/:nftId */
  {
    method: 'PATCH',
    path: '/api/cart/items/:nftId',
    handler: async (req, res, ctx) => {
      const { nftId } = req.params
      const { quantity } = await req.json()

      const isAuth = mockStateUtils.isAuthenticated()
      if (!isAuth) {
        return res(
          ctx.status(401),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.NotAuthenticated,
              message: 'Authentication required.',
              type: 'unauthorized'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      // Validate quantity is a positive integer
      const qty = parseInt(quantity as string, 10)
      if (isNaN(qty) || qty < 1) {
        return res(
          ctx.status(400),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.ValidationFailed,
              message: 'Quantity must be a positive integer.',
              type: 'validation'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      // Validate NFT availability
      if (!mockStateUtils.isNftAvailable(nftId)) {
        return res(
          ctx.status(400),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.ItemNotAvailable,
              message: 'This NFT is no longer available.',
              type: 'validation'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      // Validate maximum quantity per NFT
      if (qty > 1) {
        return res(
          ctx.status(400),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.ValidationFailed,
              message: 'Maximum quantity per NFT is 1.',
              type: 'validation'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      mockStateUtils.updateCartQuantity(nftId, qty)

      const updatedCart = mockStateUtils.getMockState().cart

      return res(
        ctx.json<ApiResponse<CartItem[]>>({
          data: updatedCart,
          meta: { page: 1, limit: 100, total: updatedCart.length, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** DELETE /api/cart/items/:nftId */
  {
    method: 'DELETE',
    path: '/api/cart/items/:nftId',
    handler: async (req, res, ctx) => {
      const { nftId } = req.params
      const isAuth = mockStateUtils.isAuthenticated()

      mockStateUtils.removeFromCart(nftId)

      const updatedCart = mockStateUtils.getMockState().cart

      return res(
        ctx.json<ApiResponse<CartItem[]>>({
          data: updatedCart,
          meta: { page: 1, limit: 100, total: updatedCart.length, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** POST /api/cart/quote */
  {
    method: 'POST',
    path: '/api/cart/quote',
    handler: async (req, res, ctx) => {
      const { code } = await req.json()

      // Validate coupon code
      if (code === 'WELCOME10') {
        const discount = 10
        const cartTotal = parseFloat(mockStateUtils.getCartTotal())

        return res(
          ctx.json<ApiResponse<{
            discount: number
            discountType: 'percentage'
            subtotal: string
            discountAmount: string
            total: string
          }>>({
            data: {
              discount,
              discountType: 'percentage' as const,
              subtotal: cartTotal.toString(),
              discountAmount: (cartTotal * discount / 100).toString(),
              total: (cartTotal - cartTotal * discount / 100).toString()
            },
            meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
            success: true,
            requestId: 'req-' + Date.now(),
            timestamp: new Date().toISOString()
          })
        )
      }

      if (code === 'EXPIRED20') {
        return res(
          ctx.status(410),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.CouponExpired,
              message: 'This coupon has expired.',
              type: 'validation'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      if (code === 'INVALID99') {
        return res(
          ctx.status(400),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.CouponInvalid,
              message: 'Invalid coupon code.',
              type: 'validation'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      // Default: invalid coupon
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.CouponInvalid,
            message: 'The coupon code is invalid.',
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }
  },

  /** ==================== ORDER HANDLERS ==================== */

  /** POST /api/orders */
  {
    method: 'POST',
    path: '/api/orders',
    handler: async (req, res, ctx) => {
      const { idempotencyKey } = req.headers
      const isAuth = mockStateUtils.isAuthenticated()

      if (!isAuth) {
        return res(
          ctx.status(401),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.NotAuthenticated,
              message: 'Authentication required to place an order.',
              type: 'unauthorized'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      // Check idempotency key
      const cart = mockStateUtils.getMockState().cart
      if (cart.length === 0) {
        return res(
          ctx.status(400),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.ValidationFailed,
              message: 'Cart is empty.',
              type: 'validation'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      // Create order
      const nft = nftAvailable[0] // Simplified: always use first NFT
      const price = parseFloat(nft.price)
      const fee = (price * 0.06).toFixed(2) // 6% network fee
      const total = (price + parseFloat(fee)).toString()

      const order: OrderSummary = {
        id: 'order-' + Date.now(),
        status: 'pending',
        price: nft.price,
        fee,
        total,
        createdAt: new Date().toISOString(),
        nft,
        buyer: mockStateUtils.getCurrentUser()!
      }

      ;(mockStateUtils as any).setOrder(order)

      // Clear cart after successful order
      mockStateUtils.removeFromCart(nft.id)

      return res(
        ctx.json<ApiResponse<OrderSummary>>({
          data: order,
          meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** GET /api/orders/:orderId */
  {
    method: 'GET',
    path: '/api/orders/:orderId',
    handler: async (req, res, ctx) => {
      const { orderId } = req.params
      const order = orderSuccess // Simplified

      if (order.id !== orderId) {
        return res(
          ctx.status(404),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.ResourceNotFound,
              message: 'Order not found.',
              type: 'not_found'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      return res(
        ctx.json<ApiResponse<OrderSummary>>({
          data: order,
          meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** ==================== PROFILE HANDLERS ==================== */

  /** GET /api/profile */
  {
    method: 'GET',
    path: '/api/profile',
    handler: async (req, res, ctx) => {
      const isAuth = mockStateUtils.isAuthenticated()

      if (!isAuth) {
        return res(
          ctx.status(401),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.NotAuthenticated,
              message: 'Authentication required.',
              type: 'unauthorized'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      const user = mockStateUtils.getCurrentUser()!

      return res(
        ctx.json<ApiResponse<UserSummary>>({
          data: user,
          meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** PATCH /api/profile */
  {
    method: 'PATCH',
    path: '/api/profile',
    handler: async (req, res, ctx) => {
      const isAuth = mockStateUtils.isAuthenticated()

      if (!isAuth) {
        return res(
          ctx.status(401),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.NotAuthenticated,
              message: 'Authentication required.',
              type: 'unauthorized'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      const updates = await req.json()

      // Update user state
      ;(mockStateUtils as any).setUser(mockStateUtils.getCurrentUser(), undefined)

      return res(
        ctx.json<ApiResponse<UserSummary>>({
          data: { ...mockStateUtils.getCurrentUser(), ...updates },
          meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** ==================== WALLET HANDLERS ==================== */

  /** GET /api/wallets */
  {
    method: 'GET',
    path: '/api/wallets',
    handler: async (req, res, ctx) => {
      const isAuth = mockStateUtils.isAuthenticated()

      if (!isAuth) {
        return res(
          ctx.status(401),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.NotAuthenticated,
              message: 'Authentication required.',
              type: 'unauthorized'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      const wallets = [
        {
          id: 'wallet-primary',
          address: '0xAlice...123',
          label: 'Primary Wallet',
          isPrimary: true,
          network: 'Ethereum Mainnet'
        },
        {
          id: 'wallet-secondary',
          address: '0xBob...456',
          label: 'Secondary Wallet',
          isPrimary: false,
          network: 'Polygon'
        }
      ]

      return res(
        ctx.json<ApiResponse<{ wallets: typeof wallets }>>({
          data: { wallets },
          meta: { page: 1, limit: 100, total: wallets.length, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** POST /api/wallets */
  {
    method: 'POST',
    path: '/api/wallets',
    handler: async (req, res, ctx) => {
      const isAuth = mockStateUtils.isAuthenticated()

      if (!isAuth) {
        return res(
          ctx.status(401),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.NotAuthenticated,
              message: 'Authentication required.',
              type: 'unauthorized'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }

      const { address, label, network } = await req.json()

      const newWallet = {
        id: 'wallet-new',
        address,
        label,
        isPrimary: false,
        network
      }

      return res(
        ctx.json<ApiResponse<{ wallet: typeof newWallet }>>({
          data: { wallet: newWallet },
          meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  },

  /** ==================== ERROR SCENARIO HANDLERS ==================== */

  /** 404 Not Found catch-all */
  {
    method: 'ALL',
    path: '*',
    handler: async (req, res, ctx) => {
      return res(
        ctx.status(404),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ResourceNotFound,
            message: 'The requested resource could not be found.',
            type: 'not_found'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }
  },

  /** Validation error handler */
  {
    method: 'POST',
    path: '/api/*',
    handler: async (req, res, ctx) => {
      return res(
        ctx.status(422),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Validation failed. Please check the form for errors.',
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }
  }
]

/** Initialize all handlers with mock state */
export function initializeHandlers(): void {
  // Hook handlers into mock state - state utilities are imported directly
  // Handlers use mockStateUtils from ../state/mock-state
}