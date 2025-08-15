import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import Joi from 'joi';
import winston from 'winston';
import { CodeScanner } from '@manito/core';

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
app.use(express.static('public'));

// Request validation schemas
const scanRequestSchema = Joi.object({
  path: Joi.string().required(),
  options: Joi.object({
    patterns: Joi.array().items(Joi.string()).optional(),
    excludePatterns: Joi.array().items(Joi.string()).optional(),
    maxFileSize: Joi.number().positive().optional()
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

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    msg: 'Manito API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Scan endpoint
app.post('/api/scan', async (req, res) => {
  try {
    const { error, value } = scanRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Validation failed', details: error.details });
    }

    const { path: scanPath, options = {} } = value;
    
    logger.info('Starting code scan', { path: scanPath });
    broadcast('scan', { status: 'started', path: scanPath });
    
    const scanner = new CodeScanner(options);
    const result = await scanner.scan(scanPath);
    
    logger.info('Scan completed', { id: result.id, files: result.files.length });
    
    broadcast('scan', { 
      status: 'completed', 
      id: result.id,
      summary: {
        files: result.files.length,
        conflicts: result.conflicts.length,
        linesOfCode: result.metrics.linesOfCode
      }
    });
    
    res.json({ success: true, data: result });
    
  } catch (error) {
    logger.error('Scan failed', error);
    broadcast('scan', { status: 'failed', error: error.message });
    res.status(500).json({ error: 'Scan failed', message: error.message });
  }
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  const metrics = {
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    websocket: {
      connections: wss.clients.size
    }
  };
  res.json(metrics);
});

// AI integration endpoint
app.post('/api/ai/send', async (req, res) => {
  try {
    const { message, provider = 'local' } = req.body;
    
    logger.info('AI request', { provider });
    
    // Mock AI response
    const mockResponse = {
      id: `ai_${Date.now()}`,
      provider,
      response: `AI Analysis (${provider}): This code looks good but could be optimized.`,
      suggestions: [
        'Consider refactoring this function for better readability',
        'This dependency could cause circular references',
        'Performance optimization opportunity detected'
      ],
      confidence: Math.random() * 0.4 + 0.6,
      timestamp: new Date().toISOString()
    };
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({ success: true, data: mockResponse });
    broadcast('ai', { status: 'response', response: mockResponse });
    
  } catch (error) {
    logger.error('AI request failed', error);
    res.status(500).json({ error: 'AI request failed', message: error.message });
  }
});

// Graph endpoint
app.get('/api/graph/:scanId?', (req, res) => {
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
    scanId: req.params.scanId || 'mock',
    graph: mockGraph,
    metadata: {
      nodes: mockGraph.nodes.length,
      edges: mockGraph.links.length,
      generated: new Date().toISOString()
    }
  });
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
  logger.info('  POST /api/scan');
  logger.info('  GET  /api/metrics');
  logger.info('  POST /api/ai/send');
  logger.info('  GET  /api/graph/:scanId?');
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

export { app, server, wss, broadcast };