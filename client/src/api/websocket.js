// WebSocket configuration
const WS_CONFIG = {
  getBaseUrl: () => {
    if (import.meta.env.DEV) {
      return 'ws://localhost:8001/ws';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port ? ':8001' : '';
    return `${protocol}//${host}${port}/ws`;
  },
  reconnect: {
    minDelay: 1000,
    maxDelay: 30000,
    maxAttempts: 5,
    backoffFactor: 1.5,
  },
  heartbeat: {
    interval: 25000,
    timeout: 10000,
  },
  debug: import.meta.env.DEV,
};

class WebSocketService {
  constructor() {
    this.socket = null;
    this.userId = localStorage.getItem('userId');
    this.token = localStorage.getItem('token');
    this.isExplicitDisconnect = false;
    this.messageHandlers = new Set();
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.reconnectDelay = WS_CONFIG.reconnect.minDelay;
    this.heartbeatTimer = null;
    this.heartbeatTimeout = null;
    this.lastPingTime = null;
    
    // Auto-connect if we have credentials
    if (this.userId && this.token) {
      this.connect(this.userId, this.token);
    }
  }

  // Add a message handler and return a function to remove it
  addMessageHandler(handler) {
    if (typeof handler !== 'function') {
      console.error('[WebSocket] Handler must be a function');
      return () => {};
    }
    
    this.messageHandlers.add(handler);
    if (WS_CONFIG.debug) {
      console.log('[WebSocket] Message handler added, total handlers:', this.messageHandlers.size);
    }
    
    // Return a function to remove this specific handler
    return () => {
      this.messageHandlers.delete(handler);
      if (WS_CONFIG.debug) {
        console.log('[WebSocket] Message handler removed, total handlers:', this.messageHandlers.size);
      }
    };
  }

  // Remove a message handler
  removeMessageHandler(handler) {
    if (typeof handler !== 'function') {
      console.error('[WebSocket] Handler must be a function');
      return;
    }
    this.messageHandlers.delete(handler);
    if (WS_CONFIG.debug) {
      console.log('[WebSocket] Message handler removed, total handlers:', this.messageHandlers.size);
    }
  }

  connect(userId, token) {
    if (!userId || !token) {
      // Try to get from localStorage if not provided
      const storedUserId = localStorage.getItem('userId');
      const storedToken = localStorage.getItem('token');
      
      if (!storedUserId || !storedToken) {
        console.error('[WebSocket] No credentials available for WebSocket connection');
        return Promise.reject(new Error('No credentials available for WebSocket connection'));
      }
      
      this.userId = storedUserId;
      this.token = storedToken;
    } else {
      // Store new credentials
      this.userId = userId;
      this.token = token;
      localStorage.setItem('userId', userId);
      localStorage.setItem('token', token);
    }
    return this._connect();
  }

  async _connect() {
    if (this.socket) {
      this.disconnect();
    }

    this.isExplicitDisconnect = false;
    
    try {
      const wsUrl = `${WS_CONFIG.getBaseUrl()}?token=${encodeURIComponent(this.token)}&userId=${encodeURIComponent(this.userId)}`;
      this.socket = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        this.socket.onopen = () => {
          this._onOpen();
          resolve();
        };
        this.socket.onerror = (error) => {
          this._onError(error);
          reject(error);
        };
        this.socket.onclose = this._onClose.bind(this);
        this.socket.onmessage = this._onMessage.bind(this);
      });

      this._startHeartbeat();
      return true;
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this._handleReconnect();
      return false;
    }
  }

  _onOpen() {
    console.log(`[WebSocket] Connected as user ${this.userId}`);
    console.log('[WebSocket] Active handlers:', this.messageHandlers.size);
    this.reconnectAttempts = 0;
    this.reconnectDelay = WS_CONFIG.reconnect.minDelay;
    
    // Send a test message to verify connection
    this.sendMessage({ type: 'ping', timestamp: Date.now() });
  }

  _onMessage(event) {
    try {
      const message = JSON.parse(event.data);
      if (WS_CONFIG.debug) {
        console.log('[WebSocket] Message received:', message);
      }
      console.log('[WebSocket] Dispatching to', this.messageHandlers.size, 'handlers');
      this.messageHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WebSocket] Error in message handler:', error);
        }
      });
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error, event.data);
    }
  }

  _onError(error) {
    console.error('[WebSocket] Error:', error);
  }

  _onClose(event) {
    console.log(`[WebSocket] Disconnected`, event.code, event.reason);
    this._stopHeartbeat();
    
    if (!this.isExplicitDisconnect) {
      this._handleReconnect();
    }
  }

  _handleReconnect() {
    if (this.reconnectAttempts >= WS_CONFIG.reconnect.maxAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(WS_CONFIG.reconnect.backoffFactor, this.reconnectAttempts - 1),
      WS_CONFIG.reconnect.maxDelay
    );

    console.log(`[WebSocket] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this._connect().catch(console.error);
    }, delay);
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
        this.lastPingTime = Date.now();
        
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('[WebSocket] Heartbeat timeout');
          this.socket?.close();
        }, WS_CONFIG.heartbeat.timeout);
      }
    }, WS_CONFIG.heartbeat.interval);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  disconnect() {
    this.isExplicitDisconnect = true;
    this._stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  sendMessage(message) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(messageStr);
      return true;
    }
    console.warn('[WebSocket] Cannot send message - not connected');
    return false;
  }
}

export const webSocketService = new WebSocketService();