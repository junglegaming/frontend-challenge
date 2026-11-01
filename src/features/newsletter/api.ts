import { useMutation } from '@tanstack/react-query'

import { httpClient } from '@/shared/api/http-client'

export interface SubscribeNewsletterRequest {
  email: string
}

export interface SubscribeNewsletterResponse {
  success: boolean
  message: string
  email: string
}

/**
 * Hook para cadastrar e-mail na newsletter.
 */
export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: async (req: SubscribeNewsletterRequest) => {
      const response = await httpClient.post<SubscribeNewsletterResponse>(
        '/newsletter/subscribe',
        req,
      )
      return response.data
    },
  })
}
