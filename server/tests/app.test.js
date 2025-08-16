import request from 'supertest';
import { jest } from '@jest/globals';
import { app, server, wss } from '../app.js';

describe('Manito Server API', () => {
  afterAll(async () => {
    // Clean up after tests
    wss.close();
    server.close();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        ok: true,
        msg: 'Manito API Server',
        version: '1.0.0'
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('POST /api/scan', () => {
    it('should validate scan request body', async () => {
      const response = await request(app)
        .post('/api/scan')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should accept valid scan request', async () => {
      const scanRequest = {
        path: './test-fixtures',
        options: {
          patterns: ['**/*.js'],
          excludePatterns: ['node_modules/**']
        }
      };

      const response = await request(app)
        .post('/api/scan')
        .send(scanRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('files');
      expect(response.body.data).toHaveProperty('metrics');
      expect(response.body.data).toHaveProperty('conflicts');
    });
  });

  describe('GET /api/metrics', () => {
    it('should return server metrics', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('server');
      expect(response.body.server).toHaveProperty('uptime');
      expect(response.body.server).toHaveProperty('memory');
      expect(response.body.server).toHaveProperty('cpu');
      expect(response.body).toHaveProperty('websocket');
      expect(response.body.websocket).toHaveProperty('connections');
    });
  });

  describe('POST /api/ai/send', () => {
    it('should process AI requests', async () => {
      const aiRequest = {
        message: 'Analyze this code',
        provider: 'local'
      };

      const response = await request(app)
        .post('/api/ai/send')
        .send(aiRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('provider', 'local');
      expect(response.body.data).toHaveProperty('response');
      expect(response.body.data).toHaveProperty('suggestions');
      expect(response.body.data).toHaveProperty('confidence');
    });
  });

  describe('GET /api/graph/:scanId?', () => {
    it('should return mock graph data', async () => {
      const response = await request(app)
        .get('/api/graph')
        .expect(200);

      expect(response.body).toHaveProperty('scanId', 'mock');
      expect(response.body).toHaveProperty('graph');
      expect(response.body.graph).toHaveProperty('nodes');
      expect(response.body.graph).toHaveProperty('links');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.graph.nodes)).toBe(true);
      expect(Array.isArray(response.body.graph.links)).toBe(true);
    });

    it('should return graph for specific scan ID', async () => {
      const scanId = 'test-scan-123';
      const response = await request(app)
        .get(`/api/graph/${scanId}`)
        .expect(200);

      expect(response.body.scanId).toBe(scanId);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
      expect(response.body).toHaveProperty('path', '/api/unknown');
    });
  });
});

describe('WebSocket functionality', () => {
  let client;

  afterEach(() => {
    if (client) {
      client.terminate();
      client = null;
    }
  });

  it('should handle WebSocket connections', async (done) => {
    const WebSocket = (await import('ws')).default;
    client = new WebSocket('ws://localhost:3000');
    
    client.on('open', () => {
      expect(client.readyState).toBe(WebSocket.OPEN);
    });

    client.on('message', (data) => {
      const message = JSON.parse(data);
      expect(message).toHaveProperty('type', 'connected');
      expect(message).toHaveProperty('timestamp');
      expect(message).toHaveProperty('server', 'manito-v1');
      done();
    });

    client.on('error', done);
  });

  it('should handle ping/pong messages', async (done) => {
    const WebSocket = (await import('ws')).default;
    client = new WebSocket('ws://localhost:3000');
    
    client.on('open', () => {
      client.send(JSON.stringify({ type: 'ping' }));
    });

    let messageCount = 0;
    client.on('message', (data) => {
      const message = JSON.parse(data);
      messageCount++;
      
      if (messageCount === 1) {
        // First message is connection confirmation
        expect(message.type).toBe('connected');
      } else if (messageCount === 2) {
        // Second message should be pong response
        expect(message.type).toBe('pong');
        expect(message).toHaveProperty('timestamp');
        done();
      }
    });

    client.on('error', done);
  });
});