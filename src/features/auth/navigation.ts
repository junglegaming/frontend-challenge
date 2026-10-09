import type { AnyRouter } from '@tanstack/react-router';
import { sanitizeRedirect, locationHref } from '@/lib/session/guards';

export type AuthMode = 'login' | 'signup';
declare module '@tanstack/react-router' {
  interface HistoryState {
    authBackground?: string;
  }
}
let returnFocus: HTMLElement | null = null;

export function rememberAuthFocus(trigger?: HTMLElement) {
  returnFocus =
    trigger ??
    (document.activeElement instanceof HTMLElement &&
    document.activeElement !== document.body
      ? document.activeElement
      : null);
}

export function restoreAuthFocus() {
  requestAnimationFrame(() => {
    if (returnFocus?.isConnected) returnFocus.focus();
    else
      [...document.querySelectorAll<HTMLElement>('[data-auth-trigger]')]
        .find((element) => element.getClientRects().length > 0)
        ?.focus();
    returnFocus = null;
  });
}

export function authLocation(
  background: string,
  mode: AuthMode,
  destination?: string
) {
  const url = new URL(sanitizeRedirect(background), 'https://nft-marketplace.local');
  url.searchParams.set('auth', mode);
  const redirect = sanitizeRedirect(destination ?? background);
  url.searchParams.set('redirect', redirect);
  return {
    href: url.pathname + url.search + url.hash,
    state: { authBackground: sanitizeRedirect(background) },
    mask: {
      to: mode === 'login' ? ('/login' as const) : ('/signup' as const),
      search: { redirect },
      unmaskOnReload: true,
    },
  };
}

export function openAuth(
  router: AnyRouter,
  mode: AuthMode = 'login',
  destination?: string,
  trigger?: HTMLElement
) {
  rememberAuthFocus(trigger);
  const location = router.state.location;
  const background = /^\/(checkout|orders|profile|wallets)(\/|$)/.test(
    location.pathname
  )
    ? '/'
    : locationHref(location);
  return router.navigate(
    authLocation(background, mode, destination ?? locationHref(location))
  );
}

export function authBackground(href: string) {
  const url = new URL(href, 'https://nft-marketplace.local');
  url.searchParams.delete('auth');
  url.searchParams.delete('redirect');
  return url.pathname + url.search + url.hash;
}
