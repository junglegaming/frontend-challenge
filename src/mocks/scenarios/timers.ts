export type TimerHandle = ReturnType<typeof setTimeout>;

const pending = new Set<TimerHandle>();

export const schedule = (fn: () => void, ms: number): TimerHandle => {
  const handle = setTimeout(() => {
    pending.delete(handle);
    fn();
  }, ms);
  pending.add(handle);
  const nodeHandle = handle as unknown as { unref?: () => void };
  if (typeof nodeHandle.unref === 'function') nodeHandle.unref();
  return handle;
};

export const isTimerPending = (handle: TimerHandle): boolean =>
  pending.has(handle);

export const clearAllTimers = (): void => {
  for (const handle of pending) clearTimeout(handle);
  pending.clear();
};
