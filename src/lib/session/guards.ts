import { redirect, type ParsedLocation } from '@tanstack/react-router';
export { getStoredSession } from './storage';
export type { Session, UserPublic } from '@/types/api';
import type { Session } from '@/types/api';
import type { RouterContext } from './demo';
import { getStoredSession, storeSession } from './storage';

/**
 * Guarda auxiliar para rotas privadas executado no beforeLoad do TanStack Router.
 * Se o usuário não possuir sessão válida, redireciona para /login preservando a rota atual via ?redirect=.
 */
export async function requireSession({
  location,
  context,
}: {
  location: ParsedLocation;
  context: RouterContext;
}): Promise<Session> {
  await context.session.ensureHydrated();
  const session = context.session.getSnapshot().session;

  if (!session || getStoredSession()?.token !== session.token) {
    if (session) storeSession(null);
    throw redirect({
      to: '/login',
      search: {
        redirect: locationHref(location),
      },
    });
  }

  return session;
}

// Rebuild from parsed fields: masked history locations can expose href without '#'.
export function locationHref(
  location: Pick<ParsedLocation, 'pathname' | 'searchStr' | 'hash'>
): string {
  return (
    location.pathname +
    location.searchStr +
    (location.hash ? `#${location.hash.replace(/^#/, '')}` : '')
  );
}

/**
 * Sanitiza o caminho de redirecionamento para prevenir vulnerabilidades de Open Redirect.
 * Permite apenas caminhos internos que começam com um único '/' (e não '//' ou protocolos).
 */
export function sanitizeRedirect(redirectUrl?: string): string {
  if (!redirectUrl || typeof redirectUrl !== 'string') {
    return '/';
  }

  const trimmed = redirectUrl.trim();

  // Rejeita links externos, URLs com esquema (ex: https:, javascript:) e caminhos de protocolo relativo (//)
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.includes('://') ||
    trimmed.includes('\\') ||
    [...trimmed].some((character) => character.charCodeAt(0) <= 32) ||
    /^\/(login|signup)([/?#]|$)/.test(trimmed)
  ) {
    return '/';
  }

  try {
    const url = new URL(trimmed, 'https://nft-marketplace.local');
    const pathname = decodeURIComponent(url.pathname);
    if (
      url.origin !== 'https://nft-marketplace.local' ||
      pathname.startsWith('//') ||
      pathname.includes('\\') ||
      /^\/(login|signup)([/?#]|$)/.test(pathname)
    )
      return '/';
    return trimmed;
  } catch {
    return '/';
  }
}
