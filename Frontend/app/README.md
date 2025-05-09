# Tubex Frontend Application

## Project Overview
This is the frontend application for Tubex, a B2B SaaS platform for construction materials. The application is built with React and TypeScript, providing a modern and responsive user interface for both suppliers and dealers.

## Current Status
As of May 2025, the following features are implemented:
- ✅ User authentication and authorization
- ✅ Basic dashboard layout
- ✅ API service integration layer
- ✅ State management with Redux
- 🚧 Product catalog management
- 🚧 User and role management
- 🚧 Order processing interface
- 🚧 Inventory management views

## Technology Stack
- React 18+
- TypeScript 4.9+
- Material-UI/Ant Design
- Redux for state management
- Axios for API communication
- Jest and React Testing Library

## Available Scripts

In the project directory, you can run:

### `npm start`
Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.

### `npm run lint`
Runs ESLint to check code quality.

### `npm run format`
Formats code using Prettier.

## Project Structure
```
src/
  ├── components/     # Reusable UI components
  ├── pages/         # Page components
  ├── services/      # API services
  ├── store/         # Redux store setup
  ├── hooks/         # Custom React hooks
  ├── utils/         # Utility functions
  ├── types/         # TypeScript type definitions
  └── assets/        # Static assets
```

## Development Guidelines
- Follow the established component structure
- Write unit tests for new components
- Use TypeScript for all new code
- Follow the project's ESLint and Prettier configurations
- Implement responsive designs for all new features

## Integration with Backend
The frontend communicates with the backend through RESTful APIs. Check the API documentation at:
- Development: http://localhost:3000/api-docs
- Staging: https://api-staging.tubex.com/api-docs
- Production: https://api.tubex.com/api-docs

## Contributing
1. Create a feature branch from `develop`
2. Implement your changes
3. Write/update tests
4. Submit a pull request
5. Wait for code review
