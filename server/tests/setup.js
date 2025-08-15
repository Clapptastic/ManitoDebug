import { jest } from '@jest/globals';

// Global test setup for server tests

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock process.env
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Use different port for testing

// Setup global mocks
beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  // Clean up any resources
});