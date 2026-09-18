import { ApiError } from '@/lib/crud';
export function errorKey(error: unknown) {
  if (!(error instanceof ApiError)) return 'networkError';
  return (
    (
      {
        400: 'validationError',
        401: 'sessionExpired',
        403: 'forbidden',
        404: 'notFound',
        409: 'conflict',
        429: 'rateLimited',
      } as Record<number, string>
    )[error.status] || 'error'
  );
}
