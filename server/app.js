import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import Joi from 'joi';
import winston from 'winston';
import { CodeScanner } from '@manito/core';
import aiService from './services/ai.js';
import Project from './models/Project.js';
import Scan from './models/Scan.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import { authenticate, optionalAuth, apiRateLimit, userContext } from './middleware/auth.js';
import StreamingScanner from './services/scanner.js';
import scanQueue from './services/scanQueue.js';

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.static('public'));

// Rate limiting and user context
app.use(apiRateLimit);
app.use(optionalAuth);
app.use(userContext);

// Request validation schemas
const scanRequestSchema = Joi.object({
  path: Joi.string().required(),
  options: Joi.object({
    patterns: Joi.array().items(Joi.string()).optional(),
    excludePatterns: Joi.array().items(Joi.string()).optional(),
    maxFileSize: Joi.number().positive().optional(),
    async: Joi.boolean().default(false), // Whether to run scan asynchronously
    maxConcurrency: Joi.number().min(1).max(8).optional(),
    timeout: Joi.number().min(1000).max(600000).optional() // 1s to 10min
  }).optional()
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  logger.info('WebSocket client connected');
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'subscribe':
          ws.subscriptions = message.channels || [];
          ws.send(JSON.stringify({ type: 'subscribed', channels: ws.subscriptions }));
          break;
        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
      }
    } catch (error) {
      logger.error('WebSocket message error', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
  });
  
  ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now(), server: 'manito-v1' }));
});

// Broadcast to WebSocket clients
function broadcast(channel, data) {
  const message = JSON.stringify({ channel, data, timestamp: Date.now() });
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN && 
        (!client.subscriptions || client.subscriptions.includes(channel))) {
      client.send(message);
    }
  });
}

// Set up scan queue event listeners for WebSocket broadcasting
scanQueue.on('jobQueued', (jobData) => {
  broadcast('scanQueue', { event: 'jobQueued', job: jobData });
});

scanQueue.on('jobStarted', (jobData) => {
  broadcast('scanQueue', { event: 'jobStarted', job: jobData });
});

scanQueue.on('scanStarted', (data) => {
  broadcast('scan', { event: 'started', ...data });
});

scanQueue.on('scanProgress', (progressData) => {
  broadcast('scan', { event: 'progress', ...progressData });
});

scanQueue.on('jobCompleted', (data) => {
  broadcast('scanQueue', { event: 'jobCompleted', job: data });
  broadcast('scan', { event: 'completed', ...data });
});

scanQueue.on('jobFailed', (data) => {
  broadcast('scanQueue', { event: 'jobFailed', job: data });
  broadcast('scan', { event: 'failed', ...data });
});

scanQueue.on('jobCancelled', (data) => {
  broadcast('scanQueue', { event: 'jobCancelled', job: data });
  broadcast('scan', { event: 'cancelled', ...data });
});

// Auth routes
app.use('/api/auth', authRoutes);

// API Routes
app.get('/api/health', async (req, res) => {
  try {
    // Basic health info
    const health = {
      status: 'ok',
      message: 'Manito API Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      authenticated: !!req.user
    };

    // Detailed health checks (for authenticated requests or internal monitoring)
    if (req.query.detailed === 'true' || req.headers['x-health-check'] === 'internal') {
      const memory = process.memoryUsage();
      const cpu = process.cpuUsage();
      
      health.system = {
        memory: {
          used: Math.round(memory.heapUsed / 1024 / 1024),
          total: Math.round(memory.heapTotal / 1024 / 1024),
          external: Math.round(memory.external / 1024 / 1024),
          rss: Math.round(memory.rss / 1024 / 1024)
        },
        cpu: {
          user: Math.round(cpu.user / 1000),
          system: Math.round(cpu.system / 1000)
        }
      };

      health.services = {
        websocket: {
          status: wss ? 'ok' : 'error',
          connections: wss ? wss.clients.size : 0
        },
        scanQueue: {
          status: scanQueue ? 'ok' : 'error',
          ...scanQueue?.getQueueStatus() || {}
        }
      };

      // Test database connection
      try {
        await User.findById('health-check-test').catch(() => null);
        health.services.database = { status: 'ok' };
      } catch (error) {
        health.services.database = { 
          status: 'error', 
          message: error.message 
        };
        health.status = 'degraded';
      }

      // Test AI service
      try {
        const providers = aiService.getAvailableProviders();
        health.services.ai = { 
          status: 'ok', 
          providers: providers.length 
        };
      } catch (error) {
        health.services.ai = { 
          status: 'error', 
          message: error.message 
        };
      }
    }

    // Set appropriate HTTP status
    const httpStatus = health.status === 'ok' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(httpStatus).json(health);
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

// Scan endpoint - supports both sync and async modes
app.post('/api/scan', async (req, res) => {
  try {
    const { error, value } = scanRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(d => d.message)
      });
    }

    const { path: scanPath, options = {} } = value;
    const userId = req.user ? req.user.id : null;
    const isAsync = options.async || false;
    
    logger.info('Starting code scan', { 
      path: scanPath, 
      async: isAsync, 
      userId: userId || 'anonymous'
    });

    if (isAsync) {
      // Async mode: Queue the job and return immediately
      const jobId = await scanQueue.addJob({
        path: scanPath,
        options,
        userId
      });

      logger.info('Scan queued', { jobId, path: scanPath });

      res.json({
        success: true,
        async: true,
        jobId,
        message: 'Scan queued for processing',
        data: {
          jobId,
          status: 'queued',
          path: scanPath
        }
      });

    } else {
      // Sync mode: Use streaming scanner for better performance but return when complete
      const scanner = new StreamingScanner({
        maxConcurrency: options.maxConcurrency || 2,
        timeout: options.timeout || 30000,
        ...options
      });

      // Set up progress broadcasting
      scanner.on('started', () => {
        broadcast('scan', { event: 'started', path: scanPath });
      });

      scanner.on('progress', (progress) => {
        broadcast('scan', { event: 'progress', path: scanPath, ...progress });
      });

      const scanResult = await scanner.scan(scanPath);
      
      // Find or create project and save results
      let project = await Project.findByPath(scanPath, userId);
      if (!project) {
        const projectName = scanPath.split('/').pop() || 'Unknown Project';
        project = await Project.create({
          name: projectName,
          path: scanPath,
          description: `Auto-created for scan of ${scanPath}`
        }, userId);
      }

      // Create scan record and save results
      const scan = await Scan.create({
        project_id: project.id,
        scan_options: options,
        status: 'running'
      });

      await scan.complete({
        files: scanResult.files || [],
        conflicts: scanResult.conflicts || [],
        dependencies: scanResult.dependencies ? Object.entries(scanResult.dependencies).map(([from, to]) => ({ from, to })) : [],
        metrics: scanResult.metrics || {}
      });

      await project.updateScanStatus('completed');

      logger.info('Sync scan completed', { 
        scanId: scan.id, 
        files: scanResult.files.length,
        scanTime: scanResult.scanTime
      });

      broadcast('scan', { 
        event: 'completed', 
        scanId: scan.id,
        projectId: project.id,
        summary: {
          files: scanResult.files.length,
          conflicts: scanResult.conflicts.length,
          linesOfCode: scanResult.metrics?.linesOfCode || 0
        }
      });

      // Return enhanced result
      const result = {
        ...scanResult,
        scanId: scan.id,
        projectId: project.id,
        project: {
          name: project.name,
          path: project.path
        },
        savedAt: scan.completed_at
      };

      res.json({ success: true, async: false, data: result });
    }

  } catch (error) {
    logger.error('Scan endpoint error', error);
    
    broadcast('scan', { 
      event: 'failed', 
      error: error.message,
      path: req.body.path
    });

    res.status(500).json({
      success: false,
      error: 'Scan failed',
      message: error.message
    });
  }
});

// Scan queue endpoints
app.get('/api/scan/queue', (req, res) => {
  try {
    const queueStatus = scanQueue.getQueueStatus();
    res.json({ success: true, data: queueStatus });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get queue status', message: error.message });
  }
});

app.get('/api/scan/jobs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const jobs = scanQueue.getAllJobs(limit);
    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get jobs', message: error.message });
  }
});

app.get('/api/scan/jobs/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = scanQueue.getJobStatus(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get job status', message: error.message });
  }
});

app.delete('/api/scan/jobs/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const cancelled = scanQueue.cancelJob(jobId);
    
    if (!cancelled) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ success: true, message: 'Job cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel job', message: error.message });
  }
});

// Metrics endpoint - enhanced with queue metrics
app.get('/api/metrics', (req, res) => {
  const queueStatus = scanQueue.getQueueStatus();
  const metrics = {
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    websocket: {
      connections: wss.clients.size
    },
    scanQueue: queueStatus
  };
  res.json(metrics);
});

// AI providers endpoint
app.get('/api/ai/providers', (req, res) => {
  try {
    const providers = aiService.getAvailableProviders();
    res.json({ success: true, providers });
  } catch (error) {
    logger.error('Failed to get AI providers', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get providers', 
      message: error.message 
    });
  }
});

// AI integration endpoint
app.post('/api/ai/send', async (req, res) => {
  try {
    const { message, context, provider = 'local' } = req.body;
    
    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }
    
    logger.info('AI request', { provider, messageLength: message.length, hasContext: !!context });
    
    // Use real AI service
    const response = await aiService.sendMessage(message, context, provider);
    
    logger.info('AI response generated', { 
      provider: response.provider, 
      confidence: response.confidence,
      suggestionsCount: response.suggestions.length 
    });
    
    res.json({ success: true, data: response });
    broadcast('ai', { status: 'response', response });
    
  } catch (error) {
    logger.error('AI request failed', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI request failed', 
      message: error.message 
    });
  }
});

// Projects endpoints
app.get('/api/projects', async (req, res) => {
  try {
    let projects;
    if (req.user) {
      // Get user's projects
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      projects = await Project.findByUserId(req.user.id, limit, offset);
    } else {
      // Anonymous users see no projects (or could see public projects)
      projects = [];
    }
    
    res.json({ 
      success: true, 
      data: projects,
      user: req.user ? req.user.email : 'anonymous'
    });
  } catch (error) {
    logger.error('Failed to get projects', error);
    res.status(500).json({ error: 'Failed to get projects', message: error.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    logger.error('Failed to get project', error);
    res.status(500).json({ error: 'Failed to get project', message: error.message });
  }
});

// Scans endpoints
app.get('/api/scans', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const scans = await Scan.findRecent(limit);
    res.json({ success: true, data: scans });
  } catch (error) {
    logger.error('Failed to get scans', error);
    res.status(500).json({ error: 'Failed to get scans', message: error.message });
  }
});

app.get('/api/scans/:id', async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    
    const fullDetails = await scan.getFullDetails();
    res.json({ success: true, data: fullDetails });
  } catch (error) {
    logger.error('Failed to get scan details', error);
    res.status(500).json({ error: 'Failed to get scan details', message: error.message });
  }
});

app.get('/api/projects/:id/scans', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const scans = await Scan.findByProjectId(req.params.id, limit);
    res.json({ success: true, data: scans });
  } catch (error) {
    logger.error('Failed to get project scans', error);
    res.status(500).json({ error: 'Failed to get project scans', message: error.message });
  }
});

// Graph endpoint - updated to use real scan data
app.get('/api/graph/:scanId?', async (req, res) => {
  try {
    const { scanId } = req.params;
    
    if (scanId && scanId !== 'mock') {
      // Try to get real graph data from scan
      const scan = await Scan.findById(scanId);
      if (scan) {
        const details = await scan.getFullDetails();
        
        // Convert scan data to graph format
        const nodes = details.files.map(file => ({
          id: file.file_path,
          type: file.file_type || 'file',
          size: file.file_size || 0,
          complexity: file.complexity || 0,
          lines: file.lines_of_code || 0
        }));
        
        const links = details.dependencies.map(dep => ({
          source: dep.from_file,
          target: dep.to_file,
          type: dep.dependency_type,
          circular: dep.is_circular
        }));
        
        return res.json({
          scanId,
          graph: { nodes, links },
          metadata: {
            nodes: nodes.length,
            edges: links.length,
            generated: scan.completed_at || new Date().toISOString(),
            conflicts: details.conflicts.length,
            filesScanned: details.files_scanned
          }
        });
      }
    }
    
    // Fallback to mock data
    const mockGraph = {
      nodes: [
        { id: 'app.js', type: 'entry', size: 150, complexity: 5 },
        { id: 'utils.js', type: 'utility', size: 80, complexity: 2 },
        { id: 'api.js', type: 'service', size: 120, complexity: 4 },
        { id: 'components/Header.jsx', type: 'component', size: 60, complexity: 2 },
        { id: 'components/Graph.jsx', type: 'component', size: 200, complexity: 8 }
      ],
      links: [
        { source: 'app.js', target: 'utils.js', type: 'import', strength: 1 },
        { source: 'app.js', target: 'api.js', type: 'import', strength: 1 },
        { source: 'app.js', target: 'components/Header.jsx', type: 'import', strength: 1 },
        { source: 'components/Graph.jsx', target: 'utils.js', type: 'import', strength: 1 }
      ]
    };
    
    res.json({
      scanId: scanId || 'mock',
      graph: mockGraph,
      metadata: {
        nodes: mockGraph.nodes.length,
        edges: mockGraph.links.length,
        generated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Failed to get graph data', error);
    res.status(500).json({ error: 'Failed to get graph data', message: error.message });
  }
});

// Error handling
app.use((error, req, res, next) => {
  logger.error('Unhandled error', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Manito API Server running on port ${PORT}`);
  logger.info('Available endpoints:');
  logger.info('  GET  /api/health');
  logger.info('  POST /api/scan (sync/async)');
  logger.info('  GET  /api/scan/queue');
  logger.info('  GET  /api/scan/jobs');
  logger.info('  GET  /api/scan/jobs/:jobId');
  logger.info('  DELETE /api/scan/jobs/:jobId');
  logger.info('  GET  /api/metrics');
  logger.info('  GET  /api/projects');
  logger.info('  GET  /api/projects/:id');
  logger.info('  GET  /api/projects/:id/scans');
  logger.info('  GET  /api/scans');
  logger.info('  GET  /api/scans/:id');
  logger.info('  GET  /api/ai/providers');
  logger.info('  POST /api/ai/send');
  logger.info('  GET  /api/graph/:scanId?');
  logger.info('Performance optimizations enabled:');
  logger.info('  • Streaming scanner with parallel processing');
  logger.info('  • Async job queue for large scans');
  logger.info('  • WebSocket real-time progress updates');
  logger.info('  • Worker threads for CPU-intensive tasks');
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  scanQueue.shutdown();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  scanQueue.shutdown();
  server.close(() => {
    process.exit(0);
  });
});

export { app, server, wss, broadcast };