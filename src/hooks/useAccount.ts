import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChangePasswordInput, Profile, UpdateProfileInput } from '@/schemas/profile'
import type { User } from '@/schemas/auth'
import type { Wallet, WalletInput } from '@/schemas/wallet'
import { profileService } from '@/services/profile'
import { walletService } from '@/services/wallets'
import { queryKeys } from './query-keys'
import { useSession } from './useSession'

export function useProfile() {
  const { user } = useSession()
  return useQuery({
    queryKey: queryKeys.profile(user?.id ?? 'anon'),
    queryFn: ({ signal }) => profileService.get(signal),
    enabled: Boolean(user),
  })
}

export function useUpdateProfile() {
  const { user } = useSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileService.update(input),
    onSuccess: (profile: Profile) => {
      if (!user) return
      queryClient.setQueryData(queryKeys.profile(user.id), profile)
      queryClient.setQueryData<User>(queryKeys.session, {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        email: profile.email,
        avatar: profile.avatar,
      })
    },
  })
}

export function useChangePassword() {
  return useMutation({ mutationFn: (input: ChangePasswordInput) => profileService.changePassword(input) })
}

export function useWallets() {
  const { user } = useSession()
  return useQuery({
    queryKey: queryKeys.wallets(user?.id ?? 'anon'),
    queryFn: ({ signal }) => walletService.list(signal),
    enabled: Boolean(user),
  })
}

function useWalletMutation<TInput>(mutationFn: (input: TInput) => Promise<Wallet>) {
  const { user } = useSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (wallet) => {
      if (!user) return
      queryClient.setQueryData<Wallet[]>(queryKeys.wallets(user.id), (current = []) => {
        const exists = current.some((item) => item.id === wallet.id)
        return exists ? current.map((item) => (item.id === wallet.id ? wallet : item)) : [...current, wallet]
      })
    },
  })
}

export const useCreateWallet = () => useWalletMutation((input: WalletInput) => walletService.create(input))
export const useUpdateWallet = () =>
  useWalletMutation(({ walletId, input }: { walletId: string; input: Omit<WalletInput, 'slot'> }) => walletService.update(walletId, input))
export const useConnectWallet = () => useWalletMutation((walletId: string) => walletService.connect(walletId))
export const useDisconnectWallet = () => useWalletMutation((walletId: string) => walletService.disconnect(walletId))
