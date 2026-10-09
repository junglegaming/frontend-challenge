import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { socketHandlers } from './sockets/handlers';
import { applyResetUrlParam, getScenario, setScenario } from './scenarios';
applyResetUrlParam();
setScenario(getScenario().id);
export const worker = setupWorker(...handlers, ...socketHandlers);
