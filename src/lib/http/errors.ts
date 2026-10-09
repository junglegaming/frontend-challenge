import axios from 'axios';
import { errorEnvelopeSchema } from './schemas';
import type { ApiErrorCode } from '@/types/api';

type Fields = Record<string, string[]>;
export type AppError =
  | {
      kind: 'validation';
      fields: Fields;
      message: string;
      status: number;
      requestId?: string;
    }
  | {
      kind: 'http';
      code: ApiErrorCode;
      message: string;
      status: number;
      fields?: Fields;
      requestId?: string;
    }
  | { kind: 'network'; message: string }
  | { kind: 'canceled' };

export function toAppError(error: unknown): AppError {
  if (axios.isCancel(error)) return { kind: 'canceled' };
  if (!axios.isAxiosError(error) || !error.response) {
    return {
      kind: 'network',
      message: 'Não foi possível conectar. Tente novamente.',
    };
  }
  const status = error.response.status;
  const parsed = errorEnvelopeSchema.safeParse(error.response.data);
  if (!parsed.success) {
    return {
      kind: 'http',
      status,
      code: 'INTERNAL',
      message: 'Resposta inesperada do servidor.',
    };
  }
  const details = parsed.data.error;
  if (details.code === 'VALIDATION_ERROR') {
    return {
      kind: 'validation',
      status,
      message: details.message,
      fields: details.fields ?? {},
      requestId: details.requestId,
    };
  }
  return { kind: 'http', status, ...details };
}
