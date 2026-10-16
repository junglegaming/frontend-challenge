import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { AppShell } from "../shell";
import { Home, Detail } from "../pages/catalog";
import { CartPage, Checkout, OrderPage } from "../pages/commerce";
import { AuthPage, Profile, Wallets, Orders } from "../pages/account";
import { api } from "../api";
import { defaultSearch } from "../domain";
import { Empty } from "../components/shared";

const root = createRootRoute({
  component: AppShell,
  notFoundComponent: () => (
    <Empty
      title="Esta página não existe"
      description="Volte ao mercado para encontrar sua próxima coleção."
    />
  ),
});
export const homeRoute = createRoute({
  getParentRoute: () => root,
  path: "/",
  validateSearch: (s: Record<string, unknown> & SearchSchemaInput) => ({
    ...defaultSearch,
    q: typeof s.q === "string" ? s.q : "",
    category: typeof s.category === "string" ? s.category : "",
    network: typeof s.network === "string" ? s.network : "",
    sort: ["recent", "price-asc", "price-desc", "name"].includes(String(s.sort))
      ? String(s.sort)
      : "recent",
    page: Math.max(1, Number(s.page) || 1),
    max:
      typeof s.max === "string" && /^\d+(\.\d{1,18})?$/.test(s.max)
        ? s.max
        : "",
    favorites: s.favorites === true || s.favorites === "true",
  }),
  component: Home,
  beforeLoad: async ({ search, location }) => {
    if (search.favorites) await protect({ location });
  },
});
const detail = createRoute({
  getParentRoute: () => root,
  path: "/nft/$id",
  component: Detail,
});
const cart = createRoute({
  getParentRoute: () => root,
  path: "/carrinho",
  component: CartPage,
});
async function protect({ location }: { location: { href: string } }) {
  try {
    await api.session();
  } catch {
    throw redirect({ to: "/login", search: { returnTo: location.href } });
  }
}
const checkout = createRoute({
  getParentRoute: () => root,
  path: "/pagamento",
  beforeLoad: protect,
  component: Checkout,
});
const order = createRoute({
  getParentRoute: () => root,
  path: "/pedido/$id",
  beforeLoad: protect,
  component: OrderPage,
});
const login = createRoute({
  getParentRoute: () => root,
  path: "/login",
  validateSearch: (s: Record<string, unknown> & SearchSchemaInput) => ({
    returnTo:
      typeof s.returnTo === "string" &&
      s.returnTo.startsWith("/") &&
      !s.returnTo.startsWith("//")
        ? s.returnTo
        : "/perfil",
  }),
  component: () => <AuthPage />,
});
const register = createRoute({
  getParentRoute: () => root,
  path: "/cadastro",
  component: () => <AuthPage register />,
});
const profile = createRoute({
  getParentRoute: () => root,
  path: "/perfil",
  beforeLoad: protect,
  component: Profile,
});
const wallets = createRoute({
  getParentRoute: () => root,
  path: "/carteiras",
  beforeLoad: protect,
  component: Wallets,
});
const orders = createRoute({
  getParentRoute: () => root,
  path: "/pedidos",
  beforeLoad: protect,
  component: Orders,
});
export const router = createRouter({
  routeTree: root.addChildren([
    homeRoute,
    detail,
    cart,
    checkout,
    order,
    login,
    register,
    profile,
    wallets,
    orders,
  ]),
  scrollRestoration: true,
  defaultPreload: "intent",
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
