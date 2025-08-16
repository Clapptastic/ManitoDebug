import { CodeScanner } from '@manito/core';
import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class StreamingScanner extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      maxConcurrency: Math.min(os.cpus().length, 8), // Use CPU cores but cap at 8
      batchSize: 50, // Process files in batches
      progressInterval: 100, // Emit progress every 100ms
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB memory limit
      timeoutMs: 30000, // 30 second timeout for individual files
      ...options
    };
    
    this.isRunning = false;
    this.progress = {
      totalFiles: 0,
      processedFiles: 0,
      startTime: null,
      lastProgressTime: 0
    };
  }

  async scan(rootPath, scanId = null) {
    if (this.isRunning) {
      throw new Error('Scanner is already running');
    }

    this.isRunning = true;
    this.progress.startTime = Date.now();
    
    try {
      this.emit('started', { rootPath, scanId });
      
      // Use the original scanner to find files
      const baseScanner = new CodeScanner(this.options);
      const files = await baseScanner.findFiles(rootPath);
      
      this.progress.totalFiles = files.length;
      this.emit('filesFound', { totalFiles: files.length });

      if (files.length === 0) {
        return this.completeEmptyResult(rootPath, scanId);
      }

      // Process files with performance optimizations
      const results = await this.processFilesOptimized(files, rootPath);
      
      // Build final result
      const scanTime = Date.now() - this.progress.startTime;
      const finalResult = {
        id: scanId || `scan_${Date.now()}`,
        timestamp: new Date().toISOString(),
        scanTime,
        rootPath,
        files: results.files,
        dependencies: results.dependencies,
        metrics: results.metrics,
        conflicts: results.conflicts
      };

      this.emit('completed', finalResult);
      return finalResult;

    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async processFilesOptimized(files, rootPath) {
    const results = {
      files: [],
      dependencies: new Map(),
      metrics: {
        filesScanned: 0,
        linesOfCode: 0,
        dependencies: 0,
        conflicts: []
      },
      conflicts: []
    };

    // Use worker threads for CPU-intensive parsing when we have many files
    const useWorkers = files.length > 100 && this.options.maxConcurrency > 1;
    
    if (useWorkers) {
      return await this.processWithWorkers(files, results);
    } else {
      return await this.processSequentially(files, results);
    }
  }

  async processSequentially(files, results) {
    const baseScanner = new CodeScanner(this.options);
    const batches = this.createBatches(files, this.options.batchSize);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      // Process batch concurrently but with limited concurrency
      const batchPromises = batch.map(file => this.processSingleFile(baseScanner, file));
      const batchResults = await Promise.allSettled(batchPromises);

      // Collect successful results
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.files.push(result.value);
          results.metrics.filesScanned++;
          results.metrics.linesOfCode += result.value.lines || 0;
          
          // Collect dependencies
          if (result.value.imports) {
            result.value.imports.forEach(imp => {
              baseScanner.addDependency(result.value.filePath, imp.source);
            });
          }
        } else if (result.status === 'rejected') {
          console.warn('Failed to process file:', result.reason);
        }
      }

      this.progress.processedFiles += batch.length;
      this.emitProgressIfNeeded();

      // Memory management - periodically trigger GC if available
      if (global.gc && batchIndex % 10 === 0) {
        global.gc();
      }
    }

    // Finalize dependencies and conflicts
    results.dependencies = baseScanner.serializeDependencyGraph();
    baseScanner.detectConflicts();
    results.conflicts = baseScanner.metrics.conflicts;
    results.metrics.conflicts = baseScanner.metrics.conflicts;
    results.metrics.dependencies = Object.keys(results.dependencies).length;

    return results;
  }

  async processWithWorkers(files, results) {
    const numWorkers = Math.min(this.options.maxConcurrency, files.length);
    const workerTasks = this.distributeFilesToWorkers(files, numWorkers);
    const workers = [];
    const workerPromises = [];

    try {
      // Create worker threads
      for (let i = 0; i < numWorkers; i++) {
        const worker = new Worker(path.join(__dirname, 'scanner-worker.js'), {
          workerData: {
            files: workerTasks[i] || [],
            options: this.options
          }
        });

        workers.push(worker);
        
        const workerPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            worker.terminate();
            reject(new Error(`Worker ${i} timed out`));
          }, this.options.timeoutMs * workerTasks[i].length);

          worker.on('message', (result) => {
            clearTimeout(timeout);
            resolve(result);
          });

          worker.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });

          worker.on('exit', (code) => {
            clearTimeout(timeout);
            if (code !== 0) {
              reject(new Error(`Worker ${i} exited with code ${code}`));
            }
          });
        });

        workerPromises.push(workerPromise);
      }

      // Wait for all workers to complete
      const workerResults = await Promise.allSettled(workerPromises);

      // Merge worker results
      for (const result of workerResults) {
        if (result.status === 'fulfilled') {
          const workerData = result.value;
          results.files.push(...workerData.files);
          results.metrics.filesScanned += workerData.metrics.filesScanned;
          results.metrics.linesOfCode += workerData.metrics.linesOfCode;
          
          // Merge dependencies
          Object.keys(workerData.dependencies).forEach(key => {
            results.dependencies.set(key, workerData.dependencies[key]);
          });
        }
      }

      this.progress.processedFiles = results.files.length;
      this.emitProgressIfNeeded();

    } finally {
      // Clean up workers
      workers.forEach(worker => {
        try {
          worker.terminate();
        } catch (error) {
          console.warn('Error terminating worker:', error);
        }
      });
    }

    return results;
  }

  async processSingleFile(scanner, filePath) {
    try {
      const startTime = Date.now();
      const result = await Promise.race([
        scanner.scanFile(filePath),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`File scan timeout: ${filePath}`)), this.options.timeoutMs)
        )
      ]);
      
      if (result) {
        result.scanTime = Date.now() - startTime;
      }
      
      return result;
    } catch (error) {
      console.warn(`Error processing ${filePath}:`, error.message);
      return null;
    }
  }

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  distributeFilesToWorkers(files, numWorkers) {
    const tasks = Array(numWorkers).fill(null).map(() => []);
    
    files.forEach((file, index) => {
      tasks[index % numWorkers].push(file);
    });
    
    return tasks;
  }

  emitProgressIfNeeded() {
    const now = Date.now();
    if (now - this.progress.lastProgressTime >= this.options.progressInterval) {
      const progress = {
        processedFiles: this.progress.processedFiles,
        totalFiles: this.progress.totalFiles,
        percentage: Math.round((this.progress.processedFiles / this.progress.totalFiles) * 100),
        elapsedTime: now - this.progress.startTime,
        estimatedTimeRemaining: this.calculateETA(now)
      };
      
      this.emit('progress', progress);
      this.progress.lastProgressTime = now;
    }
  }

  calculateETA(now) {
    if (this.progress.processedFiles === 0) return null;
    
    const elapsedTime = now - this.progress.startTime;
    const avgTimePerFile = elapsedTime / this.progress.processedFiles;
    const remainingFiles = this.progress.totalFiles - this.progress.processedFiles;
    
    return Math.round(avgTimePerFile * remainingFiles);
  }

  completeEmptyResult(rootPath, scanId) {
    const result = {
      id: scanId || `scan_${Date.now()}`,
      timestamp: new Date().toISOString(),
      scanTime: Date.now() - this.progress.startTime,
      rootPath,
      files: [],
      dependencies: {},
      metrics: {
        filesScanned: 0,
        linesOfCode: 0,
        dependencies: 0,
        conflicts: []
      },
      conflicts: []
    };

    this.emit('completed', result);
    return result;
  }

  // Utility methods
  cancel() {
    if (this.isRunning) {
      this.isRunning = false;
      this.emit('cancelled');
    }
  }

  getProgress() {
    return {
      ...this.progress,
      isRunning: this.isRunning,
      percentage: this.progress.totalFiles > 0 
        ? Math.round((this.progress.processedFiles / this.progress.totalFiles) * 100)
        : 0
    };
  }
}

export default StreamingScanner;