import '@testing-library/jest-dom';

// Real ResizeObserver implementation using polyfill
class RealResizeObserver {
  private callback: ResizeObserverCallback;
  private observedElements: Map<Element, { width: number; height: number }> = new Map();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    const rect = element.getBoundingClientRect();
    this.observedElements.set(element, { width: rect.width, height: rect.height });
    
    // Trigger initial callback with proper DOMRectReadOnly
    const contentRect = new DOMRectReadOnly(rect.x, rect.y, rect.width, rect.height);
    
    const entries = [{
      target: element,
      contentRect,
      borderBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
      contentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
      devicePixelContentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }]
    }] as unknown as ResizeObserverEntry[];
    
    this.callback(entries, this);
  }

  unobserve(element: Element) {
    this.observedElements.delete(element);
  }

  disconnect() {
    this.observedElements.clear();
  }
}

global.ResizeObserver = RealResizeObserver as any;

// Real fetch implementation for testing
global.fetch = fetch || require('node-fetch');

// Keep console output for debugging - don't suppress
global.console = console;