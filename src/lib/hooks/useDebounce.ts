import { useCallback, useEffect, useMemo, useRef } from 'react';

export function useDebounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 250
) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => cancel, [cancel, delay]);

  const debouncedCallback = useCallback(
    (...args: Args) => {
      cancel();
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        callbackRef.current(...args);
      }, delay);
    },
    [cancel, delay]
  );

  return useMemo(
    () =>
      // Only attach handlers here; refs are read when the handlers execute.
      // eslint-disable-next-line react-hooks/refs
      Object.assign((...args: Args) => debouncedCallback(...args), {
        cancel: () => cancel(),
      }),
    [debouncedCallback, cancel]
  );
}
