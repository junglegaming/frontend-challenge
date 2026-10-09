import type { ScenarioId, ScenarioState } from '@/lib/http/schemas';
import { scenarioIdSchema } from '@/lib/http/schemas';
import { safeStorage } from '../db/persist';
import { resetDb } from '../db/reset';
import { applyScenarioFlags } from './hooks';
import { delay } from 'msw';

export const SCENARIO_STORAGE_KEY = 'gm_scenario';

type ProcLike = { process?: { env?: Record<string, string | undefined> } };

export const isTestEnv = (): boolean =>
  !!(globalThis as ProcLike).process?.env?.VITEST;

export const sleep = (ms: number): Promise<number> => delay(ms).then(() => ms);

let runtimeScenario: ScenarioId | undefined;

const parseId = (raw: string | null | undefined): ScenarioId | undefined => {
  if (!raw) return undefined;
  const parsed = scenarioIdSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
};

const readUrlScenario = (): ScenarioId | undefined => {
  if (typeof location === 'undefined') return undefined;
  return parseId(new URLSearchParams(location.search).get('scenario'));
};

const readStoredScenario = (): ScenarioId | undefined => {
  let raw: string | null;
  try {
    raw = safeStorage().getItem(SCENARIO_STORAGE_KEY);
  } catch {
    return undefined;
  }
  return parseId(raw);
};

const readEnvScenario = (): ScenarioId | undefined =>
  parseId(import.meta.env.VITE_MOCK_SCENARIO);

export const resolveScenario = (): ScenarioState => {
  const fromUrl = readUrlScenario();
  if (fromUrl) return { id: fromUrl, source: 'url' };
  if (runtimeScenario) return { id: runtimeScenario, source: 'runtime' };
  const fromStorage = readStoredScenario();
  if (fromStorage) return { id: fromStorage, source: 'storage' };
  const fromEnv = readEnvScenario();
  if (fromEnv) return { id: fromEnv, source: 'env' };
  return { id: 'padrao', source: 'default' };
};

export const getScenario = (): ScenarioState => resolveScenario();

export const scenarioIs = (id: ScenarioId): boolean => getScenario().id === id;

const persistScenario = (id: ScenarioId): void => {
  try {
    safeStorage().setItem(SCENARIO_STORAGE_KEY, id);
  } catch {
    return;
  }
};

export const setScenario = (id: string): ScenarioState => {
  const parsed = scenarioIdSchema.safeParse(id);
  if (!parsed.success) throw new Error('Cenário inválido');
  const next = parsed.data;
  runtimeScenario = next;
  applyScenarioFlags(next);
  persistScenario(next);
  return { id: next, source: 'runtime' };
};

let urlScenarioApplied = false;
let urlResetApplied = false;

const stripUrlParam = (name: string): void => {
  const url = new URL(location.href);
  url.searchParams.delete(name);
  history.replaceState(
    history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`
  );
};

export const applyUrlScenarioParam = (): void => {
  if (typeof location === 'undefined' || typeof history === 'undefined') return;
  if (urlScenarioApplied) return;
  const raw = new URLSearchParams(location.search).get('scenario');
  if (raw === null) return;
  const parsed = scenarioIdSchema.safeParse(raw);
  if (!parsed.success) return;
  urlScenarioApplied = true;
  setScenario(parsed.data);
  stripUrlParam('scenario');
  location.reload();
};

export const applyResetUrlParam = (): void => {
  if (typeof location === 'undefined' || typeof history === 'undefined') return;
  if (urlResetApplied) return;
  const raw = new URLSearchParams(location.search).get('reset');
  if (raw === null) return;
  urlResetApplied = true;
  if (raw === '1') {
    resetDb();
    for (const key of ['gm_session', 'gm_pending_order', 'gm_checkout_draft'])
      safeStorage().removeItem(key);
  }
  stripUrlParam('reset');
};
