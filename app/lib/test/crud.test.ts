import { GET } from '../crud';
jest.mock('@/constants/env', () => ({ API_URL: '/api/v1' }));
const response = (status: number) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => ({ success: status === 200, data: {} }),
  }) as Response;
let expired: jest.Mock;
beforeEach(() => {
  global.fetch = jest.fn();
  expired = jest.fn();
  window.addEventListener('khiarukum:unauthorized', expired);
});
afterEach(() => window.removeEventListener('khiarukum:unauthorized', expired));
test('a network failure during refresh does not sign out the user', async () => {
  jest
    .mocked(fetch)
    .mockResolvedValueOnce(response(401))
    .mockRejectedValueOnce(new TypeError('Offline'));
  await expect(GET('/students')).rejects.toThrow('Offline');
  expect(expired).not.toHaveBeenCalled();
});
test('a temporary refresh-server failure preserves the session', async () => {
  jest
    .mocked(fetch)
    .mockResolvedValueOnce(response(401))
    .mockResolvedValueOnce(response(503));
  await expect(GET('/students')).rejects.toMatchObject({ status: 503 });
  expect(expired).not.toHaveBeenCalled();
});
test('a revoked refresh session signs out the user', async () => {
  jest
    .mocked(fetch)
    .mockResolvedValueOnce(response(401))
    .mockResolvedValueOnce(response(401));
  await expect(GET('/students')).rejects.toMatchObject({ status: 401 });
  expect(expired).toHaveBeenCalledTimes(1);
});
test('a rejected request after refresh also signs out without another refresh loop', async () => {
  jest
    .mocked(fetch)
    .mockResolvedValueOnce(response(401))
    .mockResolvedValueOnce(response(200))
    .mockResolvedValueOnce(response(401));
  await expect(GET('/students')).rejects.toMatchObject({ status: 401 });
  expect(expired).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledTimes(3);
});
