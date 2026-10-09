import { createRouter, defaultParseSearch } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { sessionService } from './lib/session/service';

export const router = createRouter({
  routeTree,
  parseSearch: (search) => {
    const params = new URLSearchParams(search);
    const structuralParams = new URLSearchParams(params);
    const textKeys = ['q', 'minPrice', 'maxPrice'];
    for (const key of textKeys) structuralParams.delete(key);
    const parsed: Record<string, unknown> = defaultParseSearch(
      `?${structuralParams}`
    );
    // Keep decimal ETH and textual searches lossless at the URL boundary.
    for (const key of textKeys) {
      const raw = params.get(key);
      if (raw === null) continue;
      parsed[key] = raw;
      // TanStack serializes numeric-looking strings as JSON strings.
      if (raw.startsWith('"')) {
        try {
          const decoded: unknown = JSON.parse(raw);
          if (typeof decoded === 'string') parsed[key] = decoded;
        } catch {
          /* Preserve malformed text for schema validation. */
        }
      }
    }
    if (params.getAll('categories').length > 1) {
      parsed.categories = params.getAll('categories');
    }
    return parsed;
  },
  context: { session: sessionService },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
