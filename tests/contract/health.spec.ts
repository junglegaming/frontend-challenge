import { expect, test } from 'vitest';
import { http } from '../../src/lib/http/client';
import { healthSchema } from '../../src/lib/http/schemas';

test('shared MSW handler satisfies the health contract through Axios', async () => {
  const response = await http.get('http://localhost/api/_health');
  expect(response.status).toBe(200);
  expect(healthSchema.parse(response.data)).toEqual({ ok: true });
});
