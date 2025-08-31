import React, { useEffect } from "react";
import { AppProvider, useAppContext } from "./context/appContext";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { webSocketService } from "./api/websocket";

import Login from "./components/Login";
import Profile from "./components/Profile";
import Register from "./components/register";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Hero from "./components/layout/Hero";
import Navbar from "./components/layout/Nav";
import Footer from "./components/layout/Footer";

// Component to handle WebSocket connection management
const WebSocketManager = () => {
  const { user, setError } = useAppContext();
  const navigate = useNavigate();
  const reconnectTimer = React.useRef(null);
  const visibilityChangeHandler = React.useRef(null);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?._id) {
        console.log('[WebSocketManager] Page became visible, reconnecting WebSocket...');
        webSocketService.connect(); // Will use stored credentials
      }
    };

    // Store the handler reference for cleanup
    visibilityChangeHandler.current = handleVisibilityChange;
    document.addEventListener('visibilitychange', visibilityChangeHandler.current);

    return () => {
      if (visibilityChangeHandler.current) {
        document.removeEventListener('visibilitychange', visibilityChangeHandler.current);
      }
    };
  }, [user?._id]);

  // Handle WebSocket connection based on user authentication state
  useEffect(() => {
    if (!user?._id) {
      // No user logged in, ensure WebSocket is disconnected
      webSocketService.disconnect();
      return;
    }

    console.log('[WebSocketManager] Setting up WebSocket connection for user:', user._id);
    
    // Connect WebSocket when user logs in
    const connectWebSocket = async () => {
      try {
        await webSocketService.connect(user._id, user.token);
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      } catch (error) {
        console.error('[WebSocketManager] Connection error:', error);
        setError('Failed to establish real-time connection. Some features may be limited.');
        
        // Schedule a reconnection attempt with exponential backoff
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
        }
        
        const delay = Math.min(1000 * Math.pow(2, webSocketService.reconnectAttempts), 30000);
        console.log(`[WebSocketManager] Will attempt to reconnect in ${delay}ms`);
        
        reconnectTimer.current = setTimeout(() => {
          if (user?._id) {
            console.log('[WebSocketManager] Attempting to reconnect...');
            connectWebSocket();
          }
        }, delay);
      }
    };

    // Initial connection
    connectWebSocket();

    // Handle page refresh/close
    const handleBeforeUnload = () => {
      console.log('[WebSocketManager] Page is being unloaded, disconnecting WebSocket');
      webSocketService.disconnect();
    };

    // Handle visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[WebSocketManager] Page is visible, reconnecting WebSocket if needed');
        connectWebSocket();
      } else {
        console.log('[WebSocketManager] Page is hidden, disconnecting WebSocket');
        webSocketService.disconnect();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount or when user changes
    return () => {
      console.log('[WebSocketManager] Cleaning up WebSocket connection');
      
      // Clear any pending reconnection attempts
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Only disconnect if we're not just switching users
      if (!user?._id) {
        webSocketService.disconnect();
      }
    };
  }, [user?._id, setError]);

  return null; // This component doesn't render anything
};

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <div className="flex flex-col min-h-screen">
      <WebSocketManager />
      <Navbar />
      {isLandingPage && <Hero />}
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
