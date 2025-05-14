import { useState, useEffect } from 'react';
import { useMockData } from '../contexts/MockDataContext';
import { isMockApiEnabled } from '../services/api/apiClient';

/**
 * This hook provides a way to use mock data as a fallback when the API is not available.
 * It's especially useful during development when you want to work without a backend.
 * 
 * @param apiCall - The function that makes the actual API call
 * @param mockDataSelector - A function that selects the appropriate mock data
 * @param dependencies - An array of dependencies that should trigger a re-fetch
 */
export function useMockableData<T>(
  apiCall: () => Promise<T>,
  mockDataSelector: () => T,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { isMockEnabled } = useMockData();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isMockEnabled || isMockApiEnabled) {
          // Use mock data
          const mockData = mockDataSelector();
          
          // Artificial delay to simulate network request
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (isMounted) {
            setData(mockData);
            setLoading(false);
          }
        } else {
          // Use real API
          const result = await apiCall();
          
          if (isMounted) {
            setData(result);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
          
          // If real API fails, fallback to mock data
          const mockData = mockDataSelector();
          setData(mockData);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [...dependencies]);

  return { data, loading, error };
}

export default useMockableData;
