import { useState, useCallback, useRef, useEffect } from 'react';

// Types
export type ApiRequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiRequestState<T> {
  data: T | null;
  error: Error | null;
  status: ApiRequestStatus;
  timestamp: number | null;
}

export interface ApiRequestOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  dependencies?: any[];
  initialData?: T | null;
  cache?: boolean;
  cacheKey?: string;
  cacheDuration?: number; // in milliseconds
  retry?: boolean;
  maxRetries?: number;
  retryDelay?: number; // in milliseconds
  manual?: boolean; // if true, request won't be made automatically
}

// Simple cache implementation
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Global cache store for sharing across hook instances
const apiCache = new Map<string, CacheItem<any>>();

// Function to create a default cache key from a function and arguments
function createCacheKey<T extends any[]>(
  fn: (...args: T) => Promise<any>,
  args: T
): string {
  return `${fn.name || 'anonymous'}_${JSON.stringify(args)}`;
}

// Main hook
export function useApiRequest<T, Args extends any[] = any[]>(
  fn: (...args: Args) => Promise<T>,
  defaultArgs?: Args,
  options: ApiRequestOptions<T> = {}
) {
  const {
    onSuccess,
    onError,
    dependencies = [],
    initialData = null,
    cache = false,
    cacheKey: userCacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    retry = false,
    maxRetries = 3,
    retryDelay = 1000,
    manual = false,
  } = options;

  // Initial state
  const [state, setState] = useState<ApiRequestState<T>>({
    data: initialData,
    error: null,
    status: 'idle',
    timestamp: null,
  });

  // Refs for latest values to avoid closure issues in callbacks
  const latestFn = useRef(fn);
  const latestOptions = useRef(options);
  const retryCount = useRef(0);
  const requestInProgress = useRef(false);

  // Keep refs updated
  useEffect(() => {
    latestFn.current = fn;
    latestOptions.current = options;
  }, [fn, options]);

  // Execute request helper function
  const executeRequest = useCallback(
    async (...args: Args): Promise<T> => {
      // Don't allow multiple in-flight requests for the same hook instance
      if (requestInProgress.current) {
        throw new Error('Request already in progress');
      }

      requestInProgress.current = true;
      retryCount.current = 0;      // If cache is enabled, generate cache key or use provided one
      const cacheKey = cache
        ? userCacheKey || createCacheKey(fn, args)
        : null;

      // Check cache first if enabled
      if (cache && cacheKey) {
        const cachedItem = apiCache.get(cacheKey);
        
        // If we have a cached item and it's not expired
        if (
          cachedItem &&
          cachedItem.expiresAt > Date.now()
        ) {
          // Update state with cached data
          setState({
            data: cachedItem.data,
            error: null,
            status: 'success',
            timestamp: cachedItem.timestamp,
          });
          
          // Call onSuccess if provided
          if (onSuccess) onSuccess(cachedItem.data);
          
          requestInProgress.current = false;
          return cachedItem.data;
        }
      }

      // Set loading state
      setState(prev => ({
        ...prev,
        status: 'loading',
        error: null,
      }));

      // Try to execute the request with retry logic
      const attemptRequest = async (attempt: number): Promise<T> => {
        try {
          const data = await latestFn.current(...args);
          
          // Cache result if caching is enabled
          if (cache && cacheKey) {
            const now = Date.now();
            apiCache.set(cacheKey, {
              data,
              timestamp: now,
              expiresAt: now + cacheDuration,
            });
          }
          
          // Update state with successful data
          setState({
            data,
            error: null,
            status: 'success',
            timestamp: Date.now(),
          });
          
          // Call onSuccess if provided
          if (latestOptions.current.onSuccess) {
            latestOptions.current.onSuccess(data);
          }
          
          requestInProgress.current = false;
          return data;
          
        } catch (error) {
          // If we should retry and haven't exceeded max retries
          if (retry && attempt < maxRetries) {
            retryCount.current = attempt + 1;
            
            // Wait before retrying
            await new Promise(resolve => 
              setTimeout(resolve, retryDelay * Math.pow(2, attempt))
            );
            
            // Try again
            return attemptRequest(attempt + 1);
            
          } else {
            // We're out of retries or retrying is disabled
            const errorObj = error instanceof Error ? error : new Error(String(error));
            
            // Update state with the error
            setState({
              data: null,
              error: errorObj,
              status: 'error',
              timestamp: Date.now(),
            });
            
            // Call onError if provided
            if (latestOptions.current.onError) {
              latestOptions.current.onError(errorObj);
            }
            
            requestInProgress.current = false;
            throw errorObj;
          }
        }
      };

      // Start the initial attempt
      return attemptRequest(0);
    },
    [
      fn,
      onSuccess,
      onError,
      cache,
      userCacheKey,
      cacheDuration,
      retry,
      maxRetries,
      retryDelay,
    ]
  );

  // Main request function
  const request = useCallback(
    (...args: Args) => {
      return executeRequest(...(args.length ? args : defaultArgs || [] as unknown as Args));
    },
    [executeRequest, defaultArgs]
  );

  // Auto-execute on mount or when dependencies change, unless manual=true
  useEffect(() => {
    if (!manual && defaultArgs) {
      request(...defaultArgs).catch(err => {
        // Error is already handled in executeRequest
        // This catch is just to prevent unhandled rejection
      });
    }
  }, [request, manual, defaultArgs, ...dependencies]);

  // Function to invalidate cached data
  const invalidateCache = useCallback(
    (specificCacheKey?: string) => {
      if (cache) {
        if (specificCacheKey) {
          apiCache.delete(specificCacheKey);
        } else if (userCacheKey) {
          apiCache.delete(userCacheKey);
        }
      }
    },
    [cache, userCacheKey]
  );

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: initialData,
      error: null,
      status: 'idle',
      timestamp: null,
    });
  }, [initialData]);

  return {
    ...state,
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    request,
    reset,
    invalidateCache,
  };
}

export default useApiRequest;
