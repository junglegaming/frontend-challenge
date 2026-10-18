import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { realtimeHandlers } from "./realtime";

export const worker = setupWorker(...handlers, ...realtimeHandlers);
