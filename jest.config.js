export default {
  preset: 'ts-jest/presets/default-esm',
  projects: [
    {
      displayName: 'server',
      rootDir: './server',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      testEnvironment: 'node',
      preset: 'ts-jest/presets/default-esm',
      transform: {},
      transformIgnorePatterns: [
        'node_modules/(?!(chalk|ora|boxen|commander|@manito)/)'
      ],
      moduleNameMapper: {
        '^@manito/core$': '<rootDir>/../core/index.js'
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    },
    {
      displayName: 'core',
      rootDir: './core',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      testEnvironment: 'node',
      preset: 'ts-jest/presets/default-esm',
      transform: {},
      transformIgnorePatterns: [
        'node_modules/(?!(acorn|acorn-walk|glob)/)'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    },
    {
      displayName: 'client',
      rootDir: './client',
      testMatch: ['<rootDir>/tests/**/*.test.jsx'],
      testEnvironment: 'jsdom',
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { 
              targets: { node: 'current' },
              modules: 'auto'
            }],
            ['@babel/preset-react', { runtime: 'automatic' }]
          ]
        }]
      },
      transformIgnorePatterns: [
        'node_modules/(?!(d3|d3-.*|lucide-react)/)'
      ],
      moduleNameMapper: {
        '\\.(css|less|scss)$': 'identity-obj-proxy'
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    },
    {
      displayName: 'cli',
      rootDir: './cli',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      testEnvironment: 'node',
      preset: 'ts-jest/presets/default-esm',
      transform: {},
      transformIgnorePatterns: [
        'node_modules/(?!(chalk|ora|boxen|commander|@manito)/)'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    }
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'server/**/*.js',
    'core/**/*.js',
    'client/src/**/*.{js,jsx}',
    'cli/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};