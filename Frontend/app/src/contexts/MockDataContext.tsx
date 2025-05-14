import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import mockData from '../services/mock/mockData';
import { isMockApiEnabled } from '../services/api/apiClient';

// Define the shape of the context
interface MockDataContextType {
  isMockEnabled: boolean;
  mockData: typeof mockData;
}

// Create the context
export const MockDataContext = createContext<MockDataContextType>({
  isMockEnabled: true,
  mockData: mockData,
});

// Hook to consume the mock data context
export const useMockData = () => useContext(MockDataContext);

interface MockDataProviderProps {
  children: ReactNode;
}

// Provider component that makes mock data available throughout the app
export const MockDataProvider: React.FC<MockDataProviderProps> = ({ children }) => {
  const [isMockEnabled, setIsMockEnabled] = useState(isMockApiEnabled);

  // Listen for changes in the mock API state
  useEffect(() => {
    const checkMockStatus = () => {
      setIsMockEnabled(isMockApiEnabled);
    };

    // Set up an interval to check the mock status
    const intervalId = setInterval(checkMockStatus, 1000);

    // Clean up the interval
    return () => clearInterval(intervalId);
  }, []);

  // Create the context value
  const value = {
    isMockEnabled,
    mockData
  };

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
};

export default MockDataProvider;
