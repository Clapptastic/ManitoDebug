import { jest } from '@jest/globals';

// Global test setup for CLI tests

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Setup global mocks
beforeEach(() => {
  jest.clearAllMocks();
});