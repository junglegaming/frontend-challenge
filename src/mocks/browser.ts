import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { initialize } from "./database";
export const worker = setupWorker(...handlers);
export async function startMocks() {
  await initialize();
  await worker.start({ onUnhandledRequest: "bypass" });
}
