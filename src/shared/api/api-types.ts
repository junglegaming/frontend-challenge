/**
 * Shared API response types for the NFT Marketplace.
 *
 * This file serves as the single source of truth for all API contract types.
 * All mock handlers, fixtures, and the HTTP client reference these types.
 *
 * @module shared/api
 * @see src/shared/api/api-error
 * @see src/mocks/handlers
 * @see src/mocks/state
 */

import type { AxiosResponse } from 'axios'

/** Root API response wrapper */
export interface ApiResponse<T> {
  data: T
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  success: boolean
  requestId: string
  timestamp: string
}

/** Pagination parameters for API requests */
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  collectionId?: string
  minPrice?: string
  maxPrice?: string
}

/** NFT summary representation - used in list and catalog views */
export interface NftSummary {
  id: string
  title: string
  description: string
  imageUrl: string
  owner: string
  price: string
  royalty: number
  edition: number
  totalEdition: number
  isAvailable: boolean
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  attributes?: NftAttribute[]
}

/** Attribute for NFT metadata */
export interface NftAttribute {
  traitType: string
  value: string | number
}

/** Detailed NFT view - extends NftSummary with additional stats */
export interface NftDetail extends NftSummary {
  stats: {
    viewCount: number
    bidCount: number
    floorPrice: string
  }
}

/** User profile summary */
export interface UserSummary {
  id: string
  address: string
  username: string
  avatar: string | null
  walletCount: number
  totalVolume: string
  isVerified: boolean
}

/** Error response from API - consistent error shape */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    field?: string
    type: 'validation' | 'not_found' | 'unauthorized' | 'forbidden' | 'conflict' | 'server_error'
  }
  timestamp: string
  requestId: string
}

/** Authentication DTO for registration */
export interface RegisterDto {
  username: string
  email: string
  password: string
  walletAddress: string
}

/** Authentication DTO for login */
export interface LoginDto {
  email: string
  password: string
}

/** Auth session representation */
export interface AuthSession {
  user: UserSummary
  accessToken: string
  refreshToken: string
  expiresAt: string
}

/** Cart item representation */
export interface CartItem {
  nftId: string
  price: string
  quantity: number
  total: string
  nft: NftSummary
}

/** Order summary representation */
export interface OrderSummary {
  id: string
  status: 'pending' | 'confirmed' | 'rejected' | 'completed'
  price: string
  fee: string
  total: string
  createdAt: string
  nft: NftSummary
  buyer: UserSummary
}

/** Collection summary */
export interface CollectionSummary {
  id: string
  name: string
  description: string
  imageUrl: string
  floorPrice: string
  totalSupply: number
  ownerCount: number
  volume24h: string
}

/** Coupon validation result */
export interface CouponValidation {
  code: string
  valid: boolean
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minPrice: string
  maxDiscount: string
  expiresAt: string | null
  error?: string
}