import { authHandlers } from "./auth/auth.handlers";
import { walletsHandlers } from "./wallets/wallets.handlers";

export const handlers = [
  ...authHandlers,
  ...walletsHandlers,
];