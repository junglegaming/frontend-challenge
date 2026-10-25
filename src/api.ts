import axios from "axios";
import { QueryClient } from "@tanstack/react-query";
export const api = axios.create({ baseURL: "/api", timeout: 7000 });
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) =>
        count < 1 &&
        (!axios.isAxiosError(error) ||
          !error.response ||
          error.response.status >= 500),
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});
export const message = (error: unknown) =>
  axios.isAxiosError(error)
    ? error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "A resposta demorou. Tente novamente para recuperar a mesma operação."
        : "Sem conexão. Verifique a rede e tente novamente.")
    : "Não foi possível concluir a operação.";
export async function get<T>(url: string, signal?: AbortSignal) {
  return (await api.get<T>(url, { signal })).data;
}
