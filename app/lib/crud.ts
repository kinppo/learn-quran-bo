import { API_URL } from '@/constants/env';
import type { ApiResponse } from '@/types';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
let refreshing: Promise<boolean> | undefined;
async function refresh() {
  if (!refreshing)
    refreshing = fetch(`${API_URL}/auth/refresh-web`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => {
        if (r.status === 401) return false;
        if (!r.ok) throw new ApiError(r.status, 'Session refresh unavailable');
        return true;
      })
      .finally(() => {
        refreshing = undefined;
      });
  return refreshing;
}
async function sendRequest<T>(
  route: string,
  method: string,
  data?: unknown,
  retry = true,
): Promise<ApiResponse<T>> {
  const isFile = data instanceof FormData;
  const response = await fetch(`${API_URL}${route}`, {
    method,
    credentials: 'include',
    headers:
      data && !isFile ? { 'Content-Type': 'application/json' } : undefined,
    body: data === undefined ? undefined : isFile ? data : JSON.stringify(data),
  });
  if (
    response.status === 401 &&
    !route.startsWith('/auth/login') &&
    !route.startsWith('/auth/logout')
  ) {
    if (retry && (await refresh()))
      return sendRequest<T>(route, method, data, false);
    window.dispatchEvent(new Event('khiarukum:unauthorized'));
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success)
    throw new ApiError(
      response.status,
      Array.isArray(body?.error?.message)
        ? body.error.message.join(' · ')
        : body?.error?.message || 'Request failed',
    );
  return body;
}
export const GET = <T = any>(route: string) => sendRequest<T>(route, 'GET');
export const POST = <T = any>(route: string, data?: unknown) =>
  sendRequest<T>(route, 'POST', data);
export const PATCH = <T = any>(route: string, data: unknown) =>
  sendRequest<T>(route, 'PATCH', data);
export const DELETE = <T = any>(route: string) =>
  sendRequest<T>(route, 'DELETE');
export const POST_FILE = POST;
export async function allRecords(route: string) {
  const rows: any[] = [];
  for (let page = 1; ; page++) {
    const response = await GET<any[]>(`${route}?limit=100&page=${page}`);
    rows.push(...response.data);
    if (
      response.count === undefined ||
      rows.length >= response.count ||
      !response.data.length
    )
      return rows;
  }
}
