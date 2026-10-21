import type { RealtimeEvent, RealtimeEventMap, RealtimeEventType } from '@/shared/realtime/contracts'
import { store } from '../state'

export type Audience = { kind: 'everyone' } | { kind: 'user'; userId: string }

export type TypedEvent<T extends RealtimeEventType> = RealtimeEvent<T, RealtimeEventMap[T]>

/** Port used by domain services. The Socket.IO adapter implements it (see ./server.ts). */
export interface EventPublisher {
  publish<T extends RealtimeEventType>(event: TypedEvent<T>, audience: Audience): void
}

/** Builds an event envelope with a stable, monotonically increasing id. */
export function createEvent<T extends RealtimeEventType>(
  type: T,
  resource: { type: string; id: string },
  version: number,
  payload: RealtimeEventMap[T],
): TypedEvent<T> {
  const sequence = store.write((state) => ++state.eventSequence)
  return {
    id: `evt_${String(sequence).padStart(8, '0')}`,
    type,
    resource,
    version,
    occurredAt: new Date().toISOString(),
    payload,
  }
}
