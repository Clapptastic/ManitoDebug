import { CodeScanner } from '../index.js';
import fs from 'fs/promises';
import path from 'path';
import { jest } from '@jest/globals';

// Mock filesystem operations for testing
jest.mock('fs/promises');
jest.mock('glob');

describe('CodeScanner', () => {
  let scanner;
  
  beforeEach(() => {
    scanner = new CodeScanner();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultScanner = new CodeScanner();
      expect(defaultScanner.options).toEqual({
        patterns: ['**/*.{js,jsx,ts,tsx}'],
        excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
        maxFileSize: 1024 * 1024
      });
      expect(defaultScanner.dependencyGraph).toBeInstanceOf(Map);
      expect(defaultScanner.metrics).toEqual({
        filesScanned: 0,
        linesOfCode: 0,
        dependencies: 0,
        conflicts: []
      });
    });

    it('should merge custom options', () => {
      const customOptions = {
        patterns: ['**/*.js'],
        maxFileSize: 500 * 1024
      };
      const customScanner = new CodeScanner(customOptions);
      
      expect(customScanner.options.patterns).toEqual(['**/*.js']);
      expect(customScanner.options.maxFileSize).toBe(500 * 1024);
      expect(customScanner.options.excludePatterns).toEqual(['node_modules/**', 'dist/**', 'build/**']);
    });
  });

  describe('scanFile', () => {
    it('should parse JavaScript file successfully', async () => {
      const mockContent = `
        import React from 'react';
        import { Component } from './utils';
        
        function TestComponent() {
          const data = 'test';
          return <div>{data}</div>;
        }
        
        export default TestComponent;
      `;

      fs.readFile.mockResolvedValue(mockContent);

      const result = await scanner.scanFile('/test/component.jsx');
      
      expect(result).toBeDefined();
      expect(result.filePath).toBe('/test/component.jsx');
      expect(result.lines).toBe(10);
      expect(result.isJSX).toBe(true);
      expect(result.imports).toHaveLength(2);
      expect(result.imports[0].source).toBe('react');
      expect(result.imports[1].source).toBe('./utils');
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('TestComponent');
      expect(result.variables).toHaveLength(1);
      expect(result.variables[0].name).toBe('data');
    });

    it('should handle TypeScript files', async () => {
      const mockContent = `
        interface User {
          id: number;
          name: string;
        }
        
        export const getUser = (id: number): User => {
          return { id, name: 'Test' };
        };
      `;

      fs.readFile.mockResolvedValue(mockContent);

      const result = await scanner.scanFile('/test/user.ts');
      
      expect(result).toBeDefined();
      expect(result.isTypeScript).toBe(true);
      expect(result.exports).toHaveLength(1);
      expect(result.exports[0].type).toBe('variable');
      expect(result.exports[0].name).toBe('getUser');
    });

    it('should handle parse errors gracefully', async () => {
      const invalidContent = 'invalid syntax {{{';
      fs.readFile.mockResolvedValue(invalidContent);

      const result = await scanner.scanFile('/test/invalid.js');
      
      expect(result).toBeNull();
    });

    it('should calculate complexity correctly', async () => {
      const complexCode = `
        function complexFunction(data) {
          if (data.length > 0) {
            for (let i = 0; i < data.length; i++) {
              if (data[i].active) {
                try {
                  return data[i].value || 'default';
                } catch (error) {
                  console.error(error);
                }
              }
            }
          }
          return null;
        }
      `;

      fs.readFile.mockResolvedValue(complexCode);

      const result = await scanner.scanFile('/test/complex.js');
      
      expect(result).toBeDefined();
      expect(result.complexity).toBeGreaterThan(5); // Should have high complexity
    });
  });

  describe('addDependency', () => {
    it('should add dependencies to graph', () => {
      scanner.addDependency('/src/app.js', './utils.js');
      scanner.addDependency('/src/app.js', 'react');
      
      expect(scanner.dependencyGraph.has('/src/app.js')).toBe(true);
      expect(scanner.dependencyGraph.get('/src/app.js').size).toBe(2);
      expect(scanner.dependencyGraph.get('/src/app.js')).toContain('./utils.js');
      expect(scanner.dependencyGraph.get('/src/app.js')).toContain('react');
      expect(scanner.metrics.dependencies).toBe(2);
    });
  });

  describe('detectConflicts', () => {
    beforeEach(() => {
      scanner.metrics.conflicts = [];
    });

    it('should detect circular dependencies', () => {
      // Create a circular dependency: A -> B -> A
      scanner.dependencyGraph.set('/src/a.js', new Set(['./b.js']));
      scanner.dependencyGraph.set('/src/b.js', new Set(['./a.js']));
      
      scanner.detectConflicts();
      
      const circularConflict = scanner.metrics.conflicts.find(c => c.type === 'circular_dependency');
      expect(circularConflict).toBeDefined();
      expect(circularConflict.severity).toBe('error');
      expect(circularConflict.message).toContain('Circular dependency detected');
    });

    it('should detect isolated files', () => {
      scanner.dependencyGraph.set('/src/isolated.js', new Set());
      
      scanner.detectConflicts();
      
      const isolatedConflict = scanner.metrics.conflicts.find(c => c.type === 'isolated_file');
      expect(isolatedConflict).toBeDefined();
      expect(isolatedConflict.severity).toBe('warning');
      expect(isolatedConflict.message).toContain('File has no dependencies');
    });
  });

  describe('findCircularDependencies', () => {
    it('should find simple circular dependency', () => {
      scanner.dependencyGraph.set('/src/a.js', new Set(['./b.js']));
      scanner.dependencyGraph.set('/src/b.js', new Set(['./a.js']));
      
      const cycles = scanner.findCircularDependencies();
      
      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toContain('./b.js');
      expect(cycles[0]).toContain('./a.js');
    });

    it('should find complex circular dependencies', () => {
      // A -> B -> C -> A
      scanner.dependencyGraph.set('/src/a.js', new Set(['./b.js']));
      scanner.dependencyGraph.set('/src/b.js', new Set(['./c.js']));
      scanner.dependencyGraph.set('/src/c.js', new Set(['./a.js']));
      
      const cycles = scanner.findCircularDependencies();
      
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should ignore non-relative dependencies', () => {
      scanner.dependencyGraph.set('/src/a.js', new Set(['react', 'lodash']));
      
      const cycles = scanner.findCircularDependencies();
      
      expect(cycles).toHaveLength(0);
    });
  });

  describe('calculateComplexity', () => {
    it('should calculate basic complexity', () => {
      const simpleFunction = {
        type: 'FunctionDeclaration',
        body: {
          type: 'BlockStatement',
          body: [
            { type: 'ReturnStatement' }
          ]
        }
      };
      
      const complexity = scanner.calculateComplexity(simpleFunction);
      expect(complexity).toBe(1); // Base complexity
    });
  });

  describe('serializeDependencyGraph', () => {
    it('should convert Map to plain object', () => {
      scanner.dependencyGraph.set('/src/a.js', new Set(['./b.js', 'react']));
      scanner.dependencyGraph.set('/src/b.js', new Set(['./c.js']));
      
      const serialized = scanner.serializeDependencyGraph();
      
      expect(typeof serialized).toBe('object');
      expect(serialized['/src/a.js']).toEqual(['./b.js', 'react']);
      expect(serialized['/src/b.js']).toEqual(['./c.js']);
    });
  });

  describe('integration tests', () => {
    it('should handle empty directory scan', async () => {
      const { glob } = await import('glob');
      glob.mockResolvedValue([]);
      
      const result = await scanner.scan('/empty/dir');
      
      expect(result).toBeDefined();
      expect(result.files).toHaveLength(0);
      expect(result.metrics.filesScanned).toBe(0);
      expect(result.rootPath).toBe('/empty/dir');
    });
  });
});