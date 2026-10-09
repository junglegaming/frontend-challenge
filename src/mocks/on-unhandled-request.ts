import type { SharedOptions } from 'msw';

// Static files and Vite requests bypass MSW; missing API handlers are errors.
export const onUnhandledRequest: SharedOptions['onUnhandledRequest'] = (
  request,
  print
) => {
  if (new URL(request.url).pathname.startsWith('/api/')) print.error();
};
