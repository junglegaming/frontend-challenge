import { errorEnvelopeSchema } from '@/lib/http/schemas';
import type { ApiErrorCode, ErrorEnvelope } from '@/lib/http/schemas';
import type { JsonBodyType } from 'msw';
import { HttpResponse } from 'msw';

export const fnv1a = (input: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

export const fnvHex = (input: string): string =>
  fnv1a(input).toString(16).padStart(8, '0');

export const requestIdFor = (seed: string): string => `req_${fnvHex(seed)}`;

export const err = (
  status: number,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string[]>,
  requestIdSeed?: string
): HttpResponse<ErrorEnvelope> => {
  const error: ErrorEnvelope['error'] = {
    code,
    message,
    requestId: requestIdFor(requestIdSeed ?? `${status}:${code}`),
  };
  if (fields) error.fields = fields;
  return HttpResponse.json(errorEnvelopeSchema.parse({ error }), { status });
};

export const json = <T extends JsonBodyType>(
  data: T,
  status = 200
): HttpResponse<T> => HttpResponse.json<T>(data, { status });
