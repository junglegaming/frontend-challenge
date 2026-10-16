import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { initDB } from "./db";
import { realtimeHandler } from "./realtime";

const worker = setupWorker(...handlers, realtimeHandler);
const options = { onUnhandledRequest: "bypass", quiet: true } as const;
let startup: Promise<void> | undefined;
let recovery: Promise<void> | undefined;
export function startMocks() {
  return (startup ??= (async () => {
    await initDB();
    await worker.start(options);
  })());
}
export function restartMocks() {
  return (recovery ??= (async () => {
    await startMocks();
    worker.stop();
    await worker.start(options);
  })().finally(() => {
    recovery = undefined;
  }));
}
