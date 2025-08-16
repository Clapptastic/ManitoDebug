import { jest } from '@jest/globals';
import { Command } from 'commander';

// Mock dependencies
jest.mock('commander');
jest.mock('chalk', () => ({
  default: {
    cyan: jest.fn(str => str),
    yellow: jest.fn(str => str),
    red: jest.fn(str => str),
    green: jest.fn(str => str),
    bold: {
      red: jest.fn(str => str),
      green: jest.fn(str => str)
    }
  }
}));
jest.mock('ora', () => ({
  default: jest.fn(() => ({
    start: jest.fn(() => ({
      succeed: jest.fn(),
      fail: jest.fn(),
      stop: jest.fn()
    }))
  }))
}));
jest.mock('boxen', () => ({
  default: jest.fn(str => str)
}));

describe('Manito CLI', () => {
  let mockProgram;

  beforeEach(() => {
    mockProgram = {
      name: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      version: jest.fn().mockReturnThis(),
      command: jest.fn().mockReturnThis(),
      argument: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockReturnThis(),
      parse: jest.fn()
    };
    
    Command.mockImplementation(() => mockProgram);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CLI setup', () => {
    it('should configure the CLI program correctly', async () => {
      await import('../index.js');

      expect(mockProgram.name).toHaveBeenCalledWith('manito');
      expect(mockProgram.description).toHaveBeenCalledWith('AI-powered code analysis and debugging CLI');
      expect(mockProgram.version).toHaveBeenCalledWith('1.0.0');
    });

    it('should configure scan command', async () => {
      await import('../index.js');
      
      expect(mockProgram.command).toHaveBeenCalledWith('scan');
    });

    it('should configure vibe command', async () => {
      await import('../index.js');
      
      expect(mockProgram.command).toHaveBeenCalledWith('vibe');
    });
  });
});