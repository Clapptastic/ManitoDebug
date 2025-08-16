/**
 * Development tools and utilities for debugging and monitoring
 */

export interface DevToolsConfig {
  enableLogging: boolean;
  enablePerformanceMonitoring: boolean;
  enableErrorTracking: boolean;
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  // Runtime-safe: avoid ReferenceError in browsers where process is undefined
  return typeof process !== 'undefined' ? process.env?.NODE_ENV === 'development' : false;
}

export interface DevToolsState {
  isEnabled: boolean;
  showDebugInfo: boolean;
  showErrorBoundary: boolean;
  mockData: boolean;
}

/**
 * Default development tools state
 */
const defaultState: DevToolsState = {
  isEnabled: typeof process !== 'undefined' ? process.env?.NODE_ENV === 'development' : false,
  showDebugInfo: false,
  showErrorBoundary: false,
  mockData: false
};

/**
 * Development tools manager
 */
export class DevTools {
  private static instance: DevTools;
  private state: DevToolsState;

  constructor() {
    this.state = { ...defaultState };
  }

  static getInstance(): DevTools {
    if (!DevTools.instance) {
      DevTools.instance = new DevTools();
    }
    return DevTools.instance;
  }

  getState(): DevToolsState {
    return { ...this.state };
  }

  updateState(updates: Partial<DevToolsState>): void {
    this.state = { ...this.state, ...updates };
    
    if (this.state.isEnabled) {
      console.log('🛠️ DevTools state updated:', updates);
    }
  }

  isEnabled(): boolean {
    return this.state.isEnabled;
  }

  showDebugInfo(): boolean {
    return this.state.isEnabled && this.state.showDebugInfo;
  }

  log(message: string, data?: any): void {
    if (this.state.isEnabled) {
      console.log(`🛠️ ${message}`, data || '');
    }
  }

  warn(message: string, data?: any): void {
    if (this.state.isEnabled) {
      console.warn(`🛠️ ${message}`, data || '');
    }
  }

  error(message: string, error?: any): void {
    if (this.state.isEnabled) {
      console.error(`🛠️ ${message}`, error || '');
    }
  }
}

/**
 * Global dev tools instance
 */
export const devTools = DevTools.getInstance();