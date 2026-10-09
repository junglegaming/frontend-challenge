import { AxiosError, AxiosHeaders, CanceledError } from 'axios';
import { describe, expect, it } from 'vitest';
import { toAppError } from '@/lib/http/errors';
import {
  addEth,
  subEth,
  mulEth,
  mulQty,
  formatEth,
  parseEth,
  displayEth,
} from '@/lib/money';
import { keyFactory } from '@/lib/query/keys';
import { queryClient, terminalOrderOptions } from '@/lib/query/client';

describe('Dinheiro decimal', () => {
  it('preserva precisão sem aritmética de ponto flutuante', () => {
    expect(addEth('0.1', '0.2')).toBe('0.3');
    expect(subEth('1', '0.999999999999999999')).toBe('0.000000000000000001');
    expect(mulEth('0.1', '0.2')).toBe('0.02');
    expect(mulQty('0.123456789012345678', 3)).toBe('0.370370367037037034');
  });
  it('rejeita formatos que não são ETH decimal e quantidades inválidas', () => {
    for (const value of [
      'NaN',
      'Infinity',
      '1e-3',
      '',
      '0.1234567890123456789',
    ]) {
      expect(() => parseEth(value)).toThrow();
    }
    expect(() => mulQty('1', 1.5)).toThrow();
  });
  it('arredonda apenas na formatação solicitada', () => {
    expect(formatEth('0.12345', { maxDecimals: 4 })).toBe('0.1235');
    expect(displayEth('0.12345')).toBe('0.1235 ETH');
    expect(displayEth('1.239')).toBe('1.24 ETH');
  });
});

describe('Erros na fronteira HTTP', () => {
  const responseError = (status: number, data: unknown) =>
    new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status,
      data,
      statusText: '',
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
  it('distingue cancelamento e falha de transporte', () => {
    expect(toAppError(new CanceledError())).toEqual({ kind: 'canceled' });
    expect(toAppError(new AxiosError('timeout', 'ECONNABORTED')).kind).toBe(
      'network'
    );
  });
  it('preserva erros de campo e metadados do contrato', () => {
    expect(
      toAppError(
        responseError(422, {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados inválidos',
            fields: { email: ['Inválido'] },
            requestId: 'req_1',
          },
        })
      )
    ).toEqual({
      kind: 'validation',
      status: 422,
      message: 'Dados inválidos',
      fields: { email: ['Inválido'] },
      requestId: 'req_1',
    });
    expect(
      toAppError(
        responseError(409, {
          error: { code: 'QUOTE_STALE', message: 'Revise a cotação' },
        })
      )
    ).toMatchObject({ kind: 'http', code: 'QUOTE_STALE', status: 409 });
  });
  it('não expõe respostas inesperadas do servidor', () => {
    expect(
      toAppError(responseError(502, '<html>proxy error</html>'))
    ).toMatchObject({ kind: 'http', code: 'INTERNAL', status: 502 });
  });
});

describe('Cache e isolamento', () => {
  it('separa dados privados entre visitante e usuários', () => {
    expect(keyFactory.cart()).toEqual(['cart', 'anon']);
    expect(keyFactory.cart('ana')).not.toEqual(keyFactory.cart('bruno'));
    expect(keyFactory.quote(null)).toEqual(['quote', 'anon', null]);
    expect(keyFactory.order('ana', 'ord_1')).toEqual(['order', 'ana', 'ord_1']);
  });
  it('aplica defaults do contrato por recurso', () => {
    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(0);
    expect(queryClient.getQueryDefaults(keyFactory.cart()).staleTime).toBe(0);
    expect(
      queryClient.getQueryDefaults(keyFactory.order('ana', 'ord_1')).gcTime
    ).toBe(600_000);
    expect(terminalOrderOptions.staleTime).toBe(Infinity);
  });
});
