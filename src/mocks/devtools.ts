import { mockControls } from './composition'
import { SCENARIOS } from './scenarios/definitions'

declare global {
  interface Window {
    __nftMock?: typeof mockControls & { scenarios: typeof SCENARIOS }
  }
}

/** Exposes mock controls on `window.__nftMock` for manual QA and Playwright. Dev/demo only. */
export function installMockDevtools() {
  window.__nftMock = { ...mockControls, scenarios: SCENARIOS }
}
