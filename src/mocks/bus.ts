import type { RealtimeEvent } from '@/schemas/events'

type Listener = (event: RealtimeEvent, audience: { userId: string | null }) => void

const listeners = new Set<Listener>()

/** Canal interno entre o "servidor" (handlers/db) e o transporte Socket.IO mockado. */
export const bus = {
  emit(event: RealtimeEvent, audience: { userId: string | null } = { userId: null }) {
    for (const listener of listeners) listener(event, audience)
  },
  on(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
