import { parseUser } from "../lib/session";
import { parseCatalog, parseNFT, parseList } from "../lib/contracts";
import axios from "axios";
import { QueryClient, useQuery } from "@tanstack/react-query";
import type {
  CartLine,
  CatalogSearch,
  Order,
  Quote,
  User,
  Wallet,
} from "../types";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: (count, error) =>
        count < 1 &&
        (!axios.isAxiosError(error) ||
          !error.response ||
          error.response.status >= 500),
      refetchOnWindowFocus: true,
    },
    mutations: { retry: 0 },
  },
});

export const http = axios.create({ baseURL: "/api", timeout: 3500 });

http.interceptors.response.use(
  async (r) => {
    if (
      r.status !== 204 &&
      !String(r.headers["content-type"]).includes("application/json")
    ) {
      const config = r.config as typeof r.config & { mockRecovery?: boolean };
      if (
        import.meta.env.VITE_ENABLE_MOCKS !== "false" &&
        config.method === "get" &&
        !config.mockRecovery
      ) {
        const { restartMocks } = await import("../constants/mocks/browser");
        await restartMocks();
        return http.request({ ...config, mockRecovery: true } as typeof config);
      }
      throw new Error(
        "O serviço retornou uma resposta inválida. Tente novamente.",
      );
    }
    return r;
  },
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      queryClient.setQueryData(["session"], null);
      queryClient.removeQueries({
        predicate: (q) => q.queryKey[0] === "private",
      });
      window.dispatchEvent(new Event("kurio:session-expired"));
    }
    return Promise.reject(error);
  },
);
export function message(error: unknown) {
  return axios.isAxiosError(error)
    ? (error.response?.data?.message ??
        "Não foi possível conectar. Tente novamente.")
    : error instanceof Error
      ? error.message
      : "Algo deu errado.";
}
export const api = {
  session: async (signal?: AbortSignal) =>
    parseUser((await http.get<unknown>("/session", { signal })).data),
  catalog: async (search: CatalogSearch, signal?: AbortSignal) =>
    parseCatalog(
      (await http.get<unknown>("/nfts", { params: search, signal })).data,
    ),
  nft: async (id: string, signal?: AbortSignal) =>
    parseNFT((await http.get<unknown>(`/nfts/${id}`, { signal })).data),
  cart: async (signal?: AbortSignal) =>
    parseList<CartLine>((await http.get<unknown>("/cart", { signal })).data),
  quote: async (coupon: string, signal?: AbortSignal) =>
    (await http.post<Quote>("/quote", { coupon }, { signal })).data,
  wallets: async (signal?: AbortSignal) =>
    parseList<Wallet>((await http.get<unknown>("/wallets", { signal })).data),
  order: async (id: string, signal?: AbortSignal) =>
    (await http.get<Order>(`/orders/${id}`, { signal })).data,
};
export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: ({ signal }) =>
      api.session(signal).catch((e) => {
        if (axios.isAxiosError(e) && e.response?.status === 401) return null;
        throw e;
      }),
    retry: false,
  });
}
export function useCart(user?: User | null) {
  return useQuery({
    queryKey: ["cart", user?.id ?? "guest"],
    queryFn: ({ signal }) => api.cart(signal),
  });
}
export function invalidateCommerce() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["cart"] }),
    queryClient.invalidateQueries({ queryKey: ["quote"] }),
  ]);
}
export async function logout() {
  await http.post("/logout");
  queryClient.clear();
  localStorage.removeItem("kurio:attempt");
}
