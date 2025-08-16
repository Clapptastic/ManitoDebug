/**
 * Performance monitoring utilities
 */

export interface PerformanceMeasurement {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private measurements: PerformanceMeasurement[] = [];
  private maxMeasurements = 100;
  private subscribers: ((measurements: PerformanceMeasurement[]) => void)[] = [];

  startMeasurement(name: string): string {
    const id = Math.random().toString(36);
    const measurement: PerformanceMeasurement = {
      id,
      name,
      startTime: performance.now(),
      duration: 0,
      timestamp: Date.now()
    };
    
    this.measurements.push(measurement);
    return id;
  }

  endMeasurement(id: string): void {
    const measurement = this.measurements.find(m => m.id === id);
    if (measurement && measurement.duration === 0) {
      measurement.duration = performance.now() - measurement.startTime;
      
      // Notify subscribers
      this.subscribers.forEach(callback => callback([...this.measurements]));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Performance: ${measurement.name} took ${measurement.duration.toFixed(2)}ms`);
      }
    }
    
    // Keep only the latest measurements
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements = this.measurements.slice(-this.maxMeasurements);
    }
  }

  getMeasurements(): PerformanceMeasurement[] {
    return [...this.measurements];
  }

  clearMeasurements(): void {
    this.measurements = [];
    this.subscribers.forEach(callback => callback([]));
  }

  subscribe(callback: (measurements: PerformanceMeasurement[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();
