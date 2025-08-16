import { EventEmitter } from 'events';
import StreamingScanner from './scanner.js';
import Project from '../models/Project.js';
import Scan from '../models/Scan.js';

class ScanJob {
  constructor(id, scanData, options = {}) {
    this.id = id;
    this.scanData = scanData;
    this.options = options;
    this.status = 'queued';
    this.createdAt = new Date();
    this.startedAt = null;
    this.completedAt = null;
    this.progress = {
      percentage: 0,
      processedFiles: 0,
      totalFiles: 0,
      currentFile: null,
      elapsedTime: 0,
      estimatedTimeRemaining: null
    };
    this.result = null;
    this.error = null;
    this.scanner = null;
  }

  start() {
    this.status = 'running';
    this.startedAt = new Date();
  }

  complete(result) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.result = result;
    this.progress.percentage = 100;
  }

  fail(error) {
    this.status = 'failed';
    this.completedAt = new Date();
    this.error = error;
  }

  cancel() {
    if (this.status === 'running' && this.scanner) {
      this.scanner.cancel();
    }
    this.status = 'cancelled';
    this.completedAt = new Date();
  }

  updateProgress(progressData) {
    this.progress = {
      ...this.progress,
      ...progressData
    };
  }

  getDuration() {
    if (!this.startedAt) return 0;
    const endTime = this.completedAt || new Date();
    return endTime - this.startedAt;
  }

  toJSON() {
    return {
      id: this.id,
      status: this.status,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      progress: this.progress,
      duration: this.getDuration(),
      scanData: {
        path: this.scanData.path,
        projectId: this.scanData.projectId,
        userId: this.scanData.userId
      },
      error: this.error ? this.error.message : null
    };
  }
}

export class ScanQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      maxConcurrentJobs: 3, // Allow up to 3 concurrent scans
      maxQueueSize: 50,     // Maximum queued jobs
      jobTimeout: 10 * 60 * 1000, // 10 minutes timeout
      cleanupInterval: 5 * 60 * 1000, // Clean up old jobs every 5 minutes
      ...options
    };

    this.jobs = new Map();
    this.queue = [];
    this.runningJobs = new Set();
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldJobs();
    }, this.options.cleanupInterval);
  }

  async addJob(scanData, options = {}) {
    if (this.queue.length >= this.options.maxQueueSize) {
      throw new Error('Scan queue is full');
    }

    const jobId = this.generateJobId();
    const job = new ScanJob(jobId, scanData, options);
    
    this.jobs.set(jobId, job);
    this.queue.push(job);
    
    this.emit('jobQueued', job.toJSON());
    
    // Start processing if we have capacity
    this.processQueue();
    
    return jobId;
  }

  async processQueue() {
    while (this.queue.length > 0 && this.runningJobs.size < this.options.maxConcurrentJobs) {
      const job = this.queue.shift();
      this.runningJobs.add(job);
      
      // Process job asynchronously
      this.processJob(job).catch(error => {
        console.error(`Unexpected error in job ${job.id}:`, error);
      });
    }
  }

  async processJob(job) {
    try {
      job.start();
      this.emit('jobStarted', job.toJSON());

      const { scanData } = job;
      
      // Create or find project
      let project = await Project.findByPath(scanData.path, scanData.userId);
      if (!project) {
        const projectName = scanData.path.split('/').pop() || 'Unknown Project';
        project = await Project.create({
          name: projectName,
          path: scanData.path,
          description: `Auto-created for scan of ${scanData.path}`
        }, scanData.userId);
      }

      // Create scan record
      const scan = await Scan.create({
        project_id: project.id,
        scan_options: scanData.options || {},
        status: 'running'
      });

      // Update job with scan info
      job.scanData.scanId = scan.id;
      job.scanData.projectId = project.id;

      // Create and configure scanner
      const scanner = new StreamingScanner({
        maxConcurrency: Math.min(4, Math.ceil(this.options.maxConcurrentJobs / this.runningJobs.size)),
        ...scanData.options
      });

      job.scanner = scanner;

      // Set up scanner event listeners
      scanner.on('started', () => {
        this.emit('scanStarted', { jobId: job.id, scanId: scan.id });
      });

      scanner.on('filesFound', (data) => {
        job.updateProgress({ totalFiles: data.totalFiles });
        this.emit('scanProgress', { jobId: job.id, ...job.progress });
      });

      scanner.on('progress', (progressData) => {
        job.updateProgress(progressData);
        this.emit('scanProgress', { jobId: job.id, ...job.progress });
      });

      // Set job timeout
      const timeoutHandle = setTimeout(() => {
        if (job.status === 'running') {
          scanner.cancel();
          job.fail(new Error('Job timeout'));
        }
      }, this.options.jobTimeout);

      try {
        // Run the scan
        const result = await scanner.scan(scanData.path, scan.id);
        
        clearTimeout(timeoutHandle);

        if (job.status === 'running') { // Not cancelled
          // Save results to database
          await scan.complete({
            files: result.files || [],
            conflicts: result.conflicts || [],
            dependencies: result.dependencies ? Object.entries(result.dependencies).map(([from, to]) => ({ from, to })) : [],
            metrics: result.metrics || {}
          });

          // Update project scan status
          await project.updateScanStatus('completed');

          // Complete job
          job.complete(result);
          this.emit('jobCompleted', { jobId: job.id, result });
        }

      } catch (error) {
        clearTimeout(timeoutHandle);
        
        if (job.status !== 'cancelled') {
          // Mark scan as failed
          await scan.fail(error.message);
          await project.updateScanStatus('failed');

          job.fail(error);
          this.emit('jobFailed', { jobId: job.id, error: error.message });
        }
      }

    } catch (error) {
      job.fail(error);
      this.emit('jobFailed', { jobId: job.id, error: error.message });
    } finally {
      this.runningJobs.delete(job);
      // Process next job in queue
      this.processQueue();
    }
  }

  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    return job ? job.toJSON() : null;
  }

  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'queued') {
      // Remove from queue
      const queueIndex = this.queue.indexOf(job);
      if (queueIndex >= 0) {
        this.queue.splice(queueIndex, 1);
      }
    }

    job.cancel();
    this.emit('jobCancelled', { jobId });
    return true;
  }

  getQueueStatus() {
    const jobs = Array.from(this.jobs.values());
    
    return {
      queueLength: this.queue.length,
      runningJobs: this.runningJobs.size,
      maxConcurrentJobs: this.options.maxConcurrentJobs,
      totalJobs: this.jobs.size,
      jobsByStatus: {
        queued: jobs.filter(j => j.status === 'queued').length,
        running: jobs.filter(j => j.status === 'running').length,
        completed: jobs.filter(j => j.status === 'completed').length,
        failed: jobs.filter(j => j.status === 'failed').length,
        cancelled: jobs.filter(j => j.status === 'cancelled').length
      }
    };
  }

  getAllJobs(limit = 50) {
    const jobs = Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
    
    return jobs.map(job => job.toJSON());
  }

  cleanupOldJobs() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status !== 'running' && job.status !== 'queued') {
        const age = now - job.createdAt;
        if (age > maxAge) {
          this.jobs.delete(jobId);
        }
      }
    }
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  shutdown() {
    // Cancel all running jobs
    for (const job of this.runningJobs) {
      job.cancel();
    }
    
    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.emit('shutdown');
  }
}

// Create singleton instance
const scanQueue = new ScanQueue();

export default scanQueue;