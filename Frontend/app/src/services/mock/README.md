# Mock API Implementation

This solution provides a way to bypass the backend temporarily using mock data for development and testing purposes.

## How to Use

1. The mock API is enabled by default in development mode
2. A toggle switch appears at the bottom right corner of the application to easily switch between real and mock API
3. All API calls are intercepted and return realistic mock data when the mock API is enabled

## Files Created

- `src/services/mock/mockData.ts` - Contains all the mock data for different services
- `src/services/mock/mockService.ts` - Handles the interception of API calls and returns mock responses
- `src/components/common/MockApiToggle.tsx` - UI component to toggle between real and mock API
- `src/contexts/MockDataContext.tsx` - React context to access mock data throughout the app

## Accessing Mock Data in Components

You can access the mock data directly in your components using the provided hook:

```typescript
import { useMockData } from '../contexts/MockDataContext';

const MyComponent: React.FC = () => {
  const { isMockEnabled, mockData } = useMockData();
  
  // Use mockData when needed
  console.log(mockData.products.products);
  
  // You can also check if the mock API is enabled
  if (isMockEnabled) {
    console.log('Using mock API');
  }
  
  // ... rest of your component
};
```

## Adding More Mock Data

To add more mock data, simply extend the mockData.ts file with additional realistic data structures that match your API responses.

## How It Works

The implementation intercepts all Axios requests when mock mode is enabled and returns predefined responses that match your API structure. This allows you to continue developing the frontend without a functioning backend.

The mock service handles common operations like:
- Pagination
- Filtering
- CRUD operations (create, read, update, delete)
- Authentication flows

When you're ready to switch back to the real API, simply toggle the switch in the UI.
