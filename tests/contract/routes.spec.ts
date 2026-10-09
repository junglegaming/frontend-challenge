import { describe, it, expect } from 'vitest';
import { sanitizeRedirect } from '@/lib/session/guards';
import { catalogFilterSchema } from '@/features/catalog/search-params';
import { nftDetailFilterSchema } from '@/features/nft-detail/search-params';
import { parseLoginSearch } from '@/features/auth/search-params';
describe('Route search contracts', () => {
  it('reads individual URL parameters and defaults', () => {
    expect(catalogFilterSchema.parse({ q: 'abc', page: '2' })).toMatchObject({
      q: 'abc',
      page: 2,
      sort: 'relevance',
    });
    expect(
      catalogFilterSchema.parse({
        q: '',
        categories: [''],
        minPrice: '',
        maxPrice: '',
        sort: '',
        page: '',
      })
    ).toEqual({
      q: undefined,
      categories: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sort: 'relevance',
      page: 1,
    });
    expect(
      catalogFilterSchema.parse({
        categories: 'Arte digital',
        minPrice: '0.123456789012345678',
      })
    ).toMatchObject({
      categories: ['Arte digital'],
      minPrice: '0.123456789012345678',
    });
  });
  it('rejects invalid page, sort and money without numeric money conversion', () => {
    for (const value of [
      { page: 0 },
      { page: 1.5 },
      { sort: 'invalid' },
      { minPrice: '1e-3' },
    ])
      expect(catalogFilterSchema.safeParse(value).success).toBe(false);
  });
  it('validates quantity', () => {
    expect(nftDetailFilterSchema.parse({ qty: '5' })).toEqual({ qty: 5 });
    expect(nftDetailFilterSchema.parse({})).toEqual({ qty: 1 });
    for (const qty of ['0', '-1', '1.5', 'abc'])
      expect(nftDetailFilterSchema.parse({ qty }).qty).toBe(1);
  });
  it('validates login search through zod', () => {
    expect(
      parseLoginSearch({ redirect: ' /checkout?draft=abc#review ' })
    ).toEqual({ redirect: '/checkout?draft=abc#review' });
    expect(parseLoginSearch({ redirect: '' })).toEqual({ redirect: undefined });
    expect(() => parseLoginSearch({ redirect: 42 })).toThrow();
  });
  it('blocks external redirects', () => {
    for (const redirect of [
      '//evil.com',
      'https://evil.com',
      'javascript:alert(1)',
      '/\\evil.com',
      '/./login',
      '/%5cevil.com',
      '/%2F%2Fevil.com',
      '/signup',
      '',
    ])
      expect(sanitizeRedirect(redirect)).toBe('/');
    expect(sanitizeRedirect('/checkout?draft=abc#review')).toBe(
      '/checkout?draft=abc#review'
    );
  });
});
