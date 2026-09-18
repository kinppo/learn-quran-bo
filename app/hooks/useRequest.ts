import { useEffect, useState } from 'react';
import { GET } from '@/lib/crud';
import type { ApiResponse } from '@/types';
export function useRequest<T>(route: string, revision = 0) {
  const [response, setResponse] = useState<ApiResponse<T>>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    GET<T>(route)
      .then((r) => {
        if (active) setResponse(r);
      })
      .catch((e) => {
        if (active) setError(e);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [route, revision]);
  return { response, error, loading };
}
