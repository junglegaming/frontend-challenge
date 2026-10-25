type Listener = () => void
const listeners = new Set<Listener>()

/** Ponte entre o interceptor do Axios (fora do React) e o root da aplicação. */
export const sessionEvents = {
  emitExpired() {
    for (const listener of listeners) listener()
  },
  onExpired(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
