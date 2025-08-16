
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true, // Faster compilation
    }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!.*\\.mjs$)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Performance optimizations
  testTimeout: 5000, // Reduce from default 15s
  maxWorkers: '50%', // Use half of CPU cores for better performance
  cache: true,
  clearMocks: true,
  restoreMocks: true,
  
  // Bail early on first failure during development
  bail: process.env.NODE_ENV === 'development' ? 1 : 0,
  
  // Optimize coverage collection
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/integrations/supabase/types.ts',
    '!src/__tests__/**/*',
    '!src/**/*.stories.*'
  ],
  
  // Speed up by running tests in parallel
  verbose: false, // Reduce output noise
};
