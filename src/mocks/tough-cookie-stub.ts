/**
 * ponytail: substitui o `tough-cookie` do MSW no bundle (alias em vite.config.ts).
 * O MSW só o usa para emular `document.cookie` nos handlers; esta API não usa cookies (token no header
 * Authorization), e o pacote + `tldts` somavam ~258 KB de fonte no chunk que bloqueia o primeiro render.
 * Se algum handler passar a ler ou gravar cookies, remova o alias.
 */
export class MemoryCookieStore {
  idx: Record<string, unknown> = {}
}

export class CookieJar {
  getCookiesSync(): [] {
    return []
  }

  async setCookie(): Promise<void> {}
}

export const Cookie = {
  fromJSON: (): null => null,
}
