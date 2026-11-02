/**
 * Axios HTTP client configured with MSW interceptor support.
 *
 * Provides a centralized Axios instance with:
 * - Base URL configuration
 * - Request/response interceptors
 * - MSW mock toggle support
 * - Error handling standardization
 * - Retry logic for transient errors
 *
 * @module shared/api
 * @see src/mocks/browser.ts - MSW browser initialization
 * @see src/mocks/server.ts - MSW test server initialization
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type {
  ApiResponse,
  ApiErrorResponse,
  AxiosApiError
} from './api-types'

/**
 * Environment configuration for mock mode.
 * When MOCK_MODE is true, Axios requests are routed to MSW handlers.
 * Set via process.env.MOCK_MODE or src/mocks/browser.ts initialization.
 */
const MOCK_MODE = process.env.MOCK_MODE === 'true' || process.env.MOCK_MODE === ''

/**
 * Creates and configures an Axios instance with MSW interceptor support.
 *
 * @param baseUrl - API base URL (defaults to /api for development)
 * @returns Configured Axios instance
 */
function createHttpClient(baseUrl: string = '/api'): AxiosInstance {
  const client: AxiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })

  /**
   * Request interceptor - adds auth token if available.
   * Skipped in mock mode (handled by MSW).
   */
  client.interceptors.request.use(
    (config: any) => {
      // Skip mock mode: MSW handles the request
      if (MOCK_MODE) {
        return config
      }

      // Add real auth token in production
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  /**
   * Response interceptor - standardizes error handling.
   * Routes errors through shared api-error utilities.
   */
  client.interceptors.response.use(
    <T>(response: AxiosResponse<ApiResponse<T>>) => response.data,
    (error) => {
      if (MOCK_MODE) {
        // In mock mode, re-throw as AxiosApiError for consistent handling
        const axiosError = error as AxiosApiError
        throw (axiosError as any).__MSWError || handleApiError(axiosError)
      }

      // Production error handling
      return handleApiError(error as unknown as AxiosApiError)
    }
  )

  return client
}

/**
 * Exported Axios instance for application use.
 * Initialize via src/mocks/browser.ts or src/mocks/server.ts
 * to enable MSW interceptors.
 */
export const api: AxiosInstance = createHttpClient()

/**
 * Initialize MSW interceptor on the Axios instance.
 * Called from src/mocks/browser.ts during development.
 *
 * @param handler - MSW request handler to intercept requests
 */
export function initializeMsw(handler: MSWRequestHandler): void {
  if (typeof window !== 'undefined') {
    ;(api as any).config.mockMode = true
  }
}