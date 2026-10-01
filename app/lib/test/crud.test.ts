import { GET, GET_FILE } from '../crud';
jest.mock('@/constants/env', () => ({ API_URL: '/api/v1' }));
const response = (status: number) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => ({ success: status === 200, data: {} }),
    blob: async () => new Blob(['binary']),
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
test('binary downloads preserve cookie credentials and refresh after unauthorized', async () => {
  jest
    .mocked(fetch)
    .mockResolvedValueOnce(response(401))
    .mockResolvedValueOnce(response(200))
    .mockResolvedValueOnce(response(200));
  const blob = await GET_FILE('/certificates/groups/g/download');
  expect(blob).toBeInstanceOf(Blob);
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(fetch).toHaveBeenLastCalledWith(
    '/api/v1/certificates/groups/g/download',
    expect.objectContaining({ credentials: 'include', method: 'GET' }),
  );
  expect(expired).not.toHaveBeenCalled();
});
test('a revoked session during a binary download triggers unauthorized handling', async () => {
  jest
    .mocked(fetch)
    .mockResolvedValueOnce(response(401))
    .mockResolvedValueOnce(response(401));
  await expect(GET_FILE('/certificates/c/download')).rejects.toMatchObject({
    status: 401,
  });
  expect(expired).toHaveBeenCalledTimes(1);
});
