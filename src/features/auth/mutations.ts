import { useMutation } from "@tanstack/react-query";
import { login, register } from "./api";

export function useLogin() {
  return useMutation({ mutationFn: login });
}

export function useRegister() {
  return useMutation({ mutationFn: register });
}
