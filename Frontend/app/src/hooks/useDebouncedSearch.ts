import { useState, useEffect, useCallback } from 'react';

interface UseDebouncedSearchOptions {
  /**
   * Time in milliseconds to wait before executing the search
   * @default 500
   */
  delay?: number;
  
  /**
   * Minimum number of characters required to trigger a search
   * @default 2
   */
  minChars?: number;
  
  /**
   * Function to be called when the search is executed
   */
  onSearch?: (query: string) => void;
  
  /**
   * Initial search value
   * @default ''
   */
  initialValue?: string;
}

/**
 * Custom hook for debounced search functionality
 * This hook prevents excessive API calls by delaying the search execution
 * until the user stops typing for a specified delay period
 * 
 * @param options Configuration options for the debounced search
 * @returns Object containing search state and handlers
 */
export function useDebouncedSearch({
  delay = 500,
  minChars = 2,
  onSearch,
  initialValue = ''
}: UseDebouncedSearchOptions = {}) {
  // Search value that changes immediately with user input
  const [searchValue, setSearchValue] = useState(initialValue);
  
  // Debounced search value that changes after the delay
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  
  // Search status
  const [isSearching, setIsSearching] = useState(false);
  
  // Flag to determine if the search is active (meets minimum criteria)
  const isActive = searchValue.length >= minChars;
  
  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setSearchValue('');
    setDebouncedValue('');
  }, []);
  
  // Execute search immediately (bypass debounce)
  const executeSearch = useCallback(() => {
    if (searchValue.length >= minChars) {
      setDebouncedValue(searchValue);
    }
  }, [searchValue, minChars]);
  
  // Effect for debouncing the search value
  useEffect(() => {
    // Don't set timer if the search value is too short
    if (searchValue.length < minChars) {
      setDebouncedValue('');
      return;
    }
    
    // Set a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, delay);
    
    // Clean up the timer if the search value changes before the delay period
    return () => {
      clearTimeout(timer);
    };
  }, [searchValue, delay, minChars]);
  
  // Effect for triggering the search when the debounced value changes
  useEffect(() => {
    // Skip if there's no search handler
    if (!onSearch) return;
    
    // Skip if the debounced value is too short
    if (debouncedValue.length < minChars) return;
    
    // Execute the search
    const executeSearch = async () => {
      setIsSearching(true);
      try {
        await onSearch(debouncedValue);
      } finally {
        setIsSearching(false);
      }
    };
    
    executeSearch();
  }, [debouncedValue, onSearch, minChars]);
  
  return {
    // States
    searchValue,
    debouncedValue,
    isSearching,
    isActive,
    
    // Handlers
    handleSearchChange,
    clearSearch,
    executeSearch
  };
}

export default useDebouncedSearch;
