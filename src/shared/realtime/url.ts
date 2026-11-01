/** Host fictício do Socket.IO (interceptado pelo MSW no navegador). */
export const REALTIME_URL = import.meta.env.VITE_SOCKET_URL || 'wss://realtime.kurio.test'
