import { WebSocketServer } from 'ws';
import winston from 'winston';
import { EventEmitter } from 'events';

class WebSocketService extends EventEmitter {
  constructor(server) {
    super();
    this.server = server;
    this.wss = null;
    this.clients = new Map(); // Track connected clients
    this.heartbeatInterval = 30000; // 30 seconds
    this.connectionTimeout = 60000; // 60 seconds
    this.maxReconnectAttempts = 5;
    
    this.logger = winston.createLogger({
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

    this.initialize();
  }

  initialize() {
    try {
      this.wss = new WebSocketServer({ 
        server: this.server,
        path: '/ws',
        clientTracking: true
      });

      this.setupEventHandlers();
      this.startHeartbeat();
      
      this.logger.info('WebSocket service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize WebSocket service', { error: error.message });
      throw error;
    }
  }

  setupEventHandlers() {
    // Connection handling
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Server error handling
    this.wss.on('error', (error) => {
      this.logger.error('WebSocket server error', { error: error.message });
      this.emit('serverError', error);
    });

    // Server close handling
    this.wss.on('close', () => {
      this.logger.info('WebSocket server closed');
      this.emit('serverClosed');
    });
  }

  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const clientInfo = {
      id: clientId,
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      connectedAt: new Date(),
      subscriptions: new Set(),
      lastPing: Date.now(),
      isAlive: true
    };

    this.clients.set(ws, clientInfo);
    
    this.logger.info('WebSocket client connected', { 
      clientId, 
      ip: clientInfo.ip,
      totalConnections: this.clients.size 
    });

    // Send welcome message
    this.sendToClient(ws, {
      type: 'connected',
      clientId,
      timestamp: Date.now(),
      server: 'manito-v1',
      features: ['real-time-updates', 'scan-progress', 'ai-analysis']
    });

    // Setup client event handlers
    this.setupClientHandlers(ws, clientInfo);

    // Emit connection event
    this.emit('clientConnected', clientInfo);
  }

  setupClientHandlers(ws, clientInfo) {
    // Message handling
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(ws, clientInfo, message);
      } catch (error) {
        this.logger.error('Failed to handle WebSocket message', { 
          clientId: clientInfo.id, 
          error: error.message 
        });
        
        this.sendToClient(ws, {
          type: 'error',
          message: 'Invalid message format',
          timestamp: Date.now()
        });
      }
    });

    // Close handling
    ws.on('close', (code, reason) => {
      this.handleClientDisconnect(ws, clientInfo, code, reason);
    });

    // Error handling
    ws.on('error', (error) => {
      this.logger.error('WebSocket client error', { 
        clientId: clientInfo.id, 
        error: error.message 
      });
      
      this.handleClientDisconnect(ws, clientInfo, 1011, 'Client error');
    });

    // Ping/Pong handling for connection health
    ws.on('pong', () => {
      clientInfo.isAlive = true;
      clientInfo.lastPing = Date.now();
    });
  }

  async handleMessage(ws, clientInfo, message) {
    const { type, ...payload } = message;

    switch (type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          timestamp: Date.now()
        });
        break;

      case 'subscribe':
        await this.handleSubscribe(ws, clientInfo, payload);
        break;

      case 'unsubscribe':
        await this.handleUnsubscribe(ws, clientInfo, payload);
        break;

      case 'scan_request':
        await this.handleScanRequest(ws, clientInfo, payload);
        break;

      case 'ai_analysis_request':
        await this.handleAIAnalysisRequest(ws, clientInfo, payload);
        break;

      default:
        this.sendToClient(ws, {
          type: 'error',
          message: `Unknown message type: ${type}`,
          timestamp: Date.now()
        });
    }
  }

  async handleSubscribe(ws, clientInfo, payload) {
    const { channels = [] } = payload;
    
    // Validate channels
    const validChannels = ['scan', 'ai_analysis', 'system', 'notifications'];
    const subscribedChannels = channels.filter(channel => validChannels.includes(channel));
    
    clientInfo.subscriptions = new Set(subscribedChannels);
    
    this.sendToClient(ws, {
      type: 'subscribed',
      channels: subscribedChannels,
      timestamp: Date.now()
    });

    this.logger.info('Client subscribed to channels', { 
      clientId: clientInfo.id, 
      channels: subscribedChannels 
    });
  }

  async handleUnsubscribe(ws, clientInfo, payload) {
    const { channels = [] } = payload;
    
    channels.forEach(channel => {
      clientInfo.subscriptions.delete(channel);
    });
    
    this.sendToClient(ws, {
      type: 'unsubscribed',
      channels,
      timestamp: Date.now()
    });

    this.logger.info('Client unsubscribed from channels', { 
      clientId: clientInfo.id, 
      channels 
    });
  }

  async handleScanRequest(ws, clientInfo, payload) {
    // Emit scan request for processing
    this.emit('scanRequest', {
      clientId: clientInfo.id,
      ...payload
    });
  }

  async handleAIAnalysisRequest(ws, clientInfo, payload) {
    // Emit AI analysis request for processing
    this.emit('aiAnalysisRequest', {
      clientId: clientInfo.id,
      ...payload
    });
  }

  handleClientDisconnect(ws, clientInfo, code, reason) {
    this.clients.delete(ws);
    
    this.logger.info('WebSocket client disconnected', { 
      clientId: clientInfo.id,
      code,
      reason,
      totalConnections: this.clients.size 
    });

    this.emit('clientDisconnected', clientInfo);
  }

  // Broadcasting methods
  broadcast(channel, data, filter = null) {
    const message = {
      channel,
      data,
      timestamp: Date.now()
    };

    let sentCount = 0;
    
    this.clients.forEach((clientInfo, ws) => {
      if (ws.readyState === ws.OPEN && 
          clientInfo.subscriptions.has(channel) &&
          (!filter || filter(clientInfo))) {
        
        try {
          ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          this.logger.error('Failed to send message to client', { 
            clientId: clientInfo.id, 
            error: error.message 
          });
        }
      }
    });

    this.logger.debug('Broadcast completed', { 
      channel, 
      sentCount, 
      totalClients: this.clients.size 
    });

    return sentCount;
  }

  sendToClient(ws, message) {
    if (ws.readyState === ws.OPEN) {
      try {
        ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        this.logger.error('Failed to send message to client', { error: error.message });
        return false;
      }
    }
    return false;
  }

  sendToClientById(clientId, message) {
    for (const [ws, clientInfo] of this.clients) {
      if (clientInfo.id === clientId) {
        return this.sendToClient(ws, message);
      }
    }
    return false;
  }

  // Heartbeat management
  startHeartbeat() {
    setInterval(() => {
      this.clients.forEach((clientInfo, ws) => {
        if (!clientInfo.isAlive) {
          this.logger.warn('Terminating inactive client', { clientId: clientInfo.id });
          ws.terminate();
          return;
        }

        clientInfo.isAlive = false;
        ws.ping();
      });
    }, this.heartbeatInterval);
  }

  // Utility methods
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getClientCount() {
    return this.clients.size;
  }

  getClientInfo(clientId) {
    for (const [ws, clientInfo] of this.clients) {
      if (clientInfo.id === clientId) {
        return clientInfo;
      }
    }
    return null;
  }

  // Graceful shutdown
  async shutdown() {
    this.logger.info('Shutting down WebSocket service...');
    
    // Close all client connections
    this.clients.forEach((clientInfo, ws) => {
      ws.close(1001, 'Server shutdown');
    });
    
    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }
    
    this.logger.info('WebSocket service shutdown complete');
  }

  // Health check
  getHealth() {
    return {
      status: 'healthy',
      connections: this.clients.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}

export default WebSocketService;
