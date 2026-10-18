const returnPaths = new Set([
  "/",
  "/checkout",
  "/profile",
  "/profile/wallets",
  "/order-confirmation",
]);

export function getSafeAuthRedirect(value: unknown): string {
  if (typeof value !== "string") return "/";
  const path = value.split(/[?#]/, 1)[0];
  return returnPaths.has(path) ? value : "/";
}

export function validateAuthSearch(search: Record<string, unknown>): { redirect?: string } {
  return search.redirect === undefined ? {} : { redirect: getSafeAuthRedirect(search.redirect) };
}
