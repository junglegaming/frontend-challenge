import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  type SearchSchemaInput,
  lazyRouteComponent,
} from "@tanstack/react-router";
import { get, queryClient } from "./api";
import type { User } from "./domain";
import { Shell, NotFound } from "./shell";
export type Search = {
  q: string;
  category: string;
  artist: string;
  sort: string;
  page: number;
  available: boolean;
};
const root = createRootRoute({ component: Shell, notFoundComponent: NotFound });
const home = createRoute({
  getParentRoute: () => root,
  path: "/",
  validateSearch: (s: Record<string, unknown> & SearchSchemaInput): Search => ({
    q: typeof s.q === "string" ? s.q : "",
    category: typeof s.category === "string" ? s.category : "",
    artist: typeof s.artist === "string" ? s.artist : "",
    sort: ["price-asc", "price-desc"].includes(String(s.sort))
      ? String(s.sort)
      : "recent",
    page: Math.max(1, Math.floor(Number(s.page) || 1)),
    available: s.available === true || s.available === "true",
  }),
  component: lazyRouteComponent(() => import("./pages/catalog"), "Catalog"),
});
const detail = createRoute({
  getParentRoute: () => root,
  path: "/nft/$id",
  component: lazyRouteComponent(() => import("./pages/catalog"), "Detail"),
});
const cart = createRoute({
  getParentRoute: () => root,
  path: "/cart",
  component: lazyRouteComponent(() => import("./pages/purchase"), "CartPage"),
});
const login = createRoute({
  getParentRoute: () => root,
  path: "/login",
  validateSearch: (s: Record<string, unknown>) => ({
    redirect:
      typeof s.redirect === "string" &&
      s.redirect.startsWith("/") &&
      !s.redirect.startsWith("//")
        ? s.redirect
        : "/",
  }),
  component: lazyRouteComponent(() => import("./pages/account"), "Login"),
});
const register = createRoute({
  getParentRoute: () => root,
  path: "/register",
  component: lazyRouteComponent(() => import("./pages/account"), "Register"),
});
async function protect({ location }: { location: { href: string } }) {
  const { user } = await get<{ user: User | null }>("/session");
  if (user) queryClient.setQueryData(["session"], { user });
  if (!user) {
    queryClient.clear();
    queryClient.setQueryData(["session"], { user: null });
    throw redirect({ to: "/login", search: { redirect: location.href } });
  }
}
const checkout = createRoute({
  getParentRoute: () => root,
  path: "/checkout",
  beforeLoad: protect,
  component: lazyRouteComponent(() => import("./pages/purchase"), "Checkout"),
});
const profile = createRoute({
  getParentRoute: () => root,
  path: "/profile",
  beforeLoad: protect,
  component: lazyRouteComponent(() => import("./pages/account"), "Profile"),
});
const wallets = createRoute({
  getParentRoute: () => root,
  path: "/wallets",
  beforeLoad: protect,
  component: lazyRouteComponent(() => import("./pages/account"), "Wallets"),
});
const favorites = createRoute({
  getParentRoute: () => root,
  path: "/favorites",
  beforeLoad: protect,
  component: lazyRouteComponent(() => import("./pages/account"), "Favorites"),
});
const order = createRoute({
  getParentRoute: () => root,
  path: "/orders/$id",
  beforeLoad: protect,
  component: lazyRouteComponent(() => import("./pages/purchase"), "Receipt"),
});
export const router = createRouter({
  routeTree: root.addChildren([
    home,
    detail,
    cart,
    login,
    register,
    checkout,
    profile,
    wallets,
    favorites,
    order,
  ]),
  defaultPreload: "intent",
  defaultErrorComponent: ({ error, reset }) => (
    <main className="container empty">
      <h1>Não foi possível abrir esta página</h1>
      <p>{error instanceof Error ? error.message : "Falha de conexão."}</p>
      <button onClick={reset}>Tentar novamente</button>
    </main>
  ),
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
