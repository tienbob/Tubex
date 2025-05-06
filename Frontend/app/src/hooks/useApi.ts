import { useState, useCallback } from 'react';

/**
 * Custom hook for handling API requests with loading and error states
 * @template T The expected response data type
 * @param apiFunction The API function to call
 * @returns Object containing data, loading state, error state, and execute function
 */
const useApi = <T>(
  apiFunction: (...args: any[]) => Promise<T>
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  return { data, loading, error, execute };
};

export default useApi;