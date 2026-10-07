import type { AuthService } from './service'

/** Adapter plugged into MockRealtimeServer: resolves the handshake token to a user id. */
export const identityResolverFor = (auth: AuthService) => (token: string | null) => auth.resolveUserId(token)
