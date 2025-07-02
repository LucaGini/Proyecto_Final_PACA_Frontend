import 'jest-preset-angular/setup-jest';

// Mock the environment.ts
jest.mock('src/environments/environment', () => ({
  environment: {
    production: false,
    apiUrl: 'http://localhost:3000'  // Add any other environment variables you need
  }
}));