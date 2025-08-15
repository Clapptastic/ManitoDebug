import { jest } from '@jest/globals';
import { spawn } from 'child_process';
import fs from 'fs/promises';

// Mock child_process and fs
jest.mock('child_process');
jest.mock('fs/promises');

describe('Manito CLI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scan command', () => {
    it('should execute scan command with default options', async () => {
      const mockSpawn = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        })
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      await execCommand('node cli/index.js scan ./src');

      expect(spawn).toHaveBeenCalledWith('node', ['cli/index.js', 'scan', './src'], {
        stdio: 'inherit',
        shell: true
      });
    });

    it('should handle scan command with custom options', async () => {
      const mockSpawn = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        })
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      await execCommand('node cli/index.js scan ./src --exclude node_modules --format json');

      expect(spawn).toHaveBeenCalledWith(
        'node', 
        ['cli/index.js', 'scan', './src', '--exclude', 'node_modules', '--format', 'json'],
        { stdio: 'inherit', shell: true }
      );
    });
  });

  describe('vibe command', () => {
    it('should execute vibe detection', async () => {
      const mockSpawn = {
        stdout: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(JSON.stringify({
                vibe: 'productive',
                confidence: 0.85,
                suggestions: ['Good code structure', 'Clear naming conventions']
              }));
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        })
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      const result = await execCommand('node cli/index.js vibe ./src');

      expect(spawn).toHaveBeenCalledWith('node', ['cli/index.js', 'vibe', './src'], {
        stdio: 'pipe',
        shell: true
      });
    });

    it('should handle vibe command errors', async () => {
      const mockSpawn = {
        stdout: { on: jest.fn() },
        stderr: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback('Error: Invalid path');
            }
          })
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10);
          }
        })
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      
      await expect(execCommand('node cli/index.js vibe /invalid/path')).rejects.toThrow();
    });
  });

  describe('serve command', () => {
    it('should start development server', async () => {
      const mockSpawn = {
        stdout: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback('Server running on http://localhost:3000');
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            // Don't close immediately for serve command
          }
        }),
        kill: jest.fn()
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      const serverProcess = execCommand('node cli/index.js serve');

      expect(spawn).toHaveBeenCalledWith('node', ['cli/index.js', 'serve'], {
        stdio: 'pipe',
        shell: true
      });

      // Clean up
      mockSpawn.kill('SIGTERM');
    });

    it('should handle custom port', async () => {
      const mockSpawn = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn()
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      execCommand('node cli/index.js serve --port 4000');

      expect(spawn).toHaveBeenCalledWith(
        'node', 
        ['cli/index.js', 'serve', '--port', '4000'],
        { stdio: 'pipe', shell: true }
      );
    });
  });

  describe('export command', () => {
    it('should export scan results', async () => {
      const mockResults = {
        id: 'scan_123',
        files: [{ filePath: './src/app.js', lines: 50 }],
        conflicts: []
      };

      fs.writeFile.mockResolvedValue();

      const mockSpawn = {
        stdout: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(JSON.stringify(mockResults));
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        })
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      await execCommand('node cli/index.js export ./src --output results.json');

      expect(spawn).toHaveBeenCalledWith(
        'node', 
        ['cli/index.js', 'export', './src', '--output', 'results.json'],
        { stdio: 'pipe', shell: true }
      );
    });

    it('should support different export formats', async () => {
      const mockSpawn = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        })
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      
      // Test CSV export
      await execCommand('node cli/index.js export ./src --format csv --output results.csv');
      expect(spawn).toHaveBeenCalledWith(
        'node', 
        ['cli/index.js', 'export', './src', '--format', 'csv', '--output', 'results.csv'],
        { stdio: 'pipe', shell: true }
      );

      // Test HTML export
      await execCommand('node cli/index.js export ./src --format html --output report.html');
      expect(spawn).toHaveBeenCalledWith(
        'node', 
        ['cli/index.js', 'export', './src', '--format', 'html', '--output', 'report.html'],
        { stdio: 'pipe', shell: true }
      );
    });
  });

  describe('argument parsing', () => {
    it('should parse global options', async () => {
      const mockSpawn = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        })
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      await execCommand('node cli/index.js scan ./src --verbose --config ./manito.config.js');

      expect(spawn).toHaveBeenCalledWith(
        'node', 
        ['cli/index.js', 'scan', './src', '--verbose', '--config', './manito.config.js'],
        { stdio: 'inherit', shell: true }
      );
    });

    it('should handle help command', async () => {
      const mockSpawn = {
        stdout: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(`
Usage: manito [options] [command]

Commands:
  scan <path>     Scan a project for dependencies and conflicts
  vibe <path>     Detect the "vibe" of a codebase
  serve           Start the Manito development server
  export <path>   Export scan results in various formats

Options:
  -V, --version   output the version number
  -h, --help      display help for command
              `);
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        })
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      const result = await execCommand('node cli/index.js --help');

      expect(spawn).toHaveBeenCalledWith('node', ['cli/index.js', '--help'], {
        stdio: 'pipe',
        shell: true
      });
    });
  });

  describe('error handling', () => {
    it('should handle command execution errors', async () => {
      const mockSpawn = {
        stdout: { on: jest.fn() },
        stderr: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback('Command failed with error');
            }
          })
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10);
          }
        })
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      
      await expect(execCommand('node cli/index.js invalid-command')).rejects.toThrow();
    });

    it('should handle missing required arguments', async () => {
      const mockSpawn = {
        stdout: { on: jest.fn() },
        stderr: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback('Error: Missing required argument <path>');
            }
          })
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10);
          }
        })
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      
      await expect(execCommand('node cli/index.js scan')).rejects.toThrow();
    });
  });

  describe('configuration', () => {
    it('should load configuration from file', async () => {
      const mockConfig = {
        patterns: ['**/*.js'],
        excludePatterns: ['test/**'],
        maxFileSize: 500000
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const mockSpawn = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        })
      };

      spawn.mockReturnValue(mockSpawn);

      const { execCommand } = await import('../index.js');
      await execCommand('node cli/index.js scan ./src --config manito.config.json');

      expect(fs.readFile).toHaveBeenCalledWith('manito.config.json', 'utf-8');
    });
  });
});

// Helper function to simulate CLI execution
async function execCommand(command) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, { stdio: 'pipe', shell: true });
    
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}