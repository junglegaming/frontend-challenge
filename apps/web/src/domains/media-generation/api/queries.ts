import { useMutation } from '@tanstack/react-query'
import { api } from '@/shared/api/http'
import type { GenerateImageRequest, GeneratedImage } from '../model/contracts'

export function useGenerateImage() {
  return useMutation({
    mutationFn: (body: GenerateImageRequest) => api.post<GeneratedImage, GenerateImageRequest>('/media/generate-image', body),
  })
}
