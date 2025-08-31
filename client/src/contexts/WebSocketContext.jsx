import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children, url, token }) => {
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000; // 3 seconds
  const pingInterval = useRef(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    // Close existing connection if any
    if (ws.current) {
      ws.current.close();
    }

    // Create new WebSocket connection with JWT token
    ws.current = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
      
      // Set up ping to keep connection alive
      pingInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000); // Send ping every 25 seconds
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      clearInterval(pingInterval.current);
      
      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
        setTimeout(connect, reconnectInterval);
      } else {
        console.error('Max reconnection attempts reached');
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.current?.close();
    };
  }, [url, token]);

  // Clean up on unmount
  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        clearInterval(pingInterval.current);
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connect]);

  // Reconnect if token changes
  useEffect(() => {
    if (token) {
      connect();
    }
  }, [token, connect]);

  // Send message function
  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    console.error('WebSocket is not connected');
    return false;
  }, []);

  // Subscribe to messages
  const subscribe = useCallback((callback) => {
    if (!ws.current) return () => {};

    const messageHandler = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Skip ping/pong messages
        if (message.type === 'pong') return;
        callback(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.addEventListener('message', messageHandler);
    return () => {
      if (ws.current) {
        ws.current.removeEventListener('message', messageHandler);
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ sendMessage, subscribe, isConnected: ws.current?.readyState === WebSocket.OPEN }}>
      {children}
    </WebSocketContext.Provider>
  );
};

WebSocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
  url: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
