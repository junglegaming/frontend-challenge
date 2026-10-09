import { createSeedDb } from '../fixtures'
import { clearAllTimers } from '../scenarios/timers'
import { replaceDb } from './store'

export const resetDb = (): void => {
  clearAllTimers()
  replaceDb(createSeedDb())
}
