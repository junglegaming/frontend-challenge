/**
 * Envelope of every Socket.IO event. Domain payloads are declared in each domain's contracts
 * and plugged into `RealtimeEventMap` there via declaration merging.
 */
export interface RealtimeEvent<TType extends string = string, TPayload = unknown> {
  /** Stable, unique event id — used to drop duplicates. */
  id: string
  type: TType
  resource: { type: string; id: string }
  /** Version of the resource after this change — used to drop stale events. */
  version: number
  occurredAt: string
  payload: TPayload
}

export interface RealtimeEventMap {}

export type RealtimeEventType = keyof RealtimeEventMap & string
