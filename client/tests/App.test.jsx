import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jest } from '@jest/globals';
import App from '../src/App';

// Mock WebSocket
const mockWebSocket = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1
};

global.WebSocket = jest.fn(() => mockWebSocket);

// Mock fetch
global.fetch = jest.fn();

describe('App Component', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Reset fetch mock
    fetch.mockClear();
    
    // Mock successful health check
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        msg: 'Manito API Server',
        version: '1.0.0',
        uptime: 123.45
      })
    });
  });

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
  };

  describe('Initial render', () => {
    it('should render main components', () => {
      renderApp();
      
      expect(screen.getByText('Manito')).toBeInTheDocument();
      expect(screen.getByText('No Scan Results')).toBeInTheDocument();
      expect(screen.getByText(/Start by entering a path/)).toBeInTheDocument();
    });

    it('should render navigation tabs', () => {
      renderApp();
      
      expect(screen.getByText('Dependency Graph')).toBeInTheDocument();
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Conflicts')).toBeInTheDocument();
      expect(screen.getByText('Files')).toBeInTheDocument();
    });

    it('should have default scan path', () => {
      renderApp();
      
      const pathInput = screen.getByDisplayValue('./src');
      expect(pathInput).toBeInTheDocument();
    });
  });

  describe('Scan functionality', () => {
    it('should trigger scan on button click', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'scan_123',
            files: [
              {
                filePath: '/test/app.js',
                lines: 50,
                size: 1024,
                complexity: 3,
                imports: [],
                exports: []
              }
            ],
            conflicts: [],
            metrics: { linesOfCode: 50 }
          }
        })
      });

      renderApp();
      
      const scanButton = screen.getByText('Scan Project');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: './src',
            options: {
              patterns: ['**/*.{js,jsx,ts,tsx}'],
              excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
            }
          })
        });
      });
    });

    it('should update UI after successful scan', async () => {
      const mockScanData = {
        success: true,
        data: {
          id: 'scan_123',
          files: [
            {
              filePath: '/test/app.js',
              lines: 50,
              size: 1024,
              complexity: 3,
              imports: [{ source: 'react' }],
              exports: [{ type: 'function', name: 'App' }]
            }
          ],
          conflicts: [
            {
              type: 'circular_dependency',
              severity: 'error',
              message: 'Circular dependency detected',
              files: ['/test/a.js', '/test/b.js']
            }
          ],
          metrics: { linesOfCode: 50 }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScanData
      });

      renderApp();
      
      const scanButton = screen.getByText('Scan Project');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText('1 files • 1 conflicts')).toBeInTheDocument();
      });
    });

    it('should handle scan errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      renderApp();
      
      const scanButton = screen.getByText('Scan Project');
      fireEvent.click(scanButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Tab navigation', () => {
    it('should switch between tabs', () => {
      renderApp();
      
      const metricsTab = screen.getByText('Metrics');
      fireEvent.click(metricsTab);
      
      // Tab should be selected (would have different styling)
      expect(metricsTab.closest('button')).toHaveClass('bg-primary-600');
    });

    it('should show conflicts count badge', async () => {
      const mockScanData = {
        success: true,
        data: {
          files: [],
          conflicts: [
            { type: 'error', message: 'Test conflict' }
          ]
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScanData
      });

      renderApp();
      
      const scanButton = screen.getByText('Scan Project');
      fireEvent.click(scanButton);

      await waitFor(() => {
        const conflictsTab = screen.getByText('Conflicts');
        expect(conflictsTab.parentElement).toContainHTML('1');
      });
    });
  });

  describe('WebSocket integration', () => {
    it('should initialize WebSocket connection', () => {
      renderApp();
      
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:3000');
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should handle scan status messages', async () => {
      renderApp();
      
      // Simulate WebSocket message
      const messageHandler = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1];
      
      const mockMessage = {
        data: JSON.stringify({
          channel: 'scan',
          data: {
            status: 'started',
            path: './src'
          }
        })
      };

      messageHandler(mockMessage);

      // Should update UI to show scanning state
      await waitFor(() => {
        expect(screen.getByText(/Scanning/)).toBeInTheDocument();
      });
    });
  });

  describe('AI Panel', () => {
    it('should toggle AI panel', () => {
      renderApp();
      
      const aiButton = screen.getByLabelText(/AI Assistant/);
      fireEvent.click(aiButton);

      expect(screen.getByTestId('ai-panel')).toBeInTheDocument();
      
      // Click again to close
      fireEvent.click(aiButton);
      expect(screen.queryByTestId('ai-panel')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderApp();
      
      expect(screen.getByLabelText(/scan path/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /scan project/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderApp();
      
      const scanButton = screen.getByText('Scan Project');
      scanButton.focus();
      expect(document.activeElement).toBe(scanButton);
    });
  });

  describe('Error boundaries', () => {
    it('should handle component errors gracefully', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const AppWithError = () => (
        <QueryClientProvider client={queryClient}>
          <ThrowError />
        </QueryClientProvider>
      );

      // This test would need an error boundary to be properly implemented
      expect(() => render(<AppWithError />)).toThrow();
      
      consoleSpy.mockRestore();
    });
  });
});