import { beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { server } from '@/mocks/server';
import { resetDb } from '@/mocks/db/reset';
import { setScenario } from '@/mocks/scenarios';
import { clearQuotes } from '@/mocks/handlers/quote';
import { clearAllTimers } from '@/mocks/scenarios/timers';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetDb();
  clearQuotes();
  setScenario('padrao');
});
afterEach(() => {
  clearAllTimers();
  server.resetHandlers();
});
afterAll(() => server.close());
