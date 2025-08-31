import React, { createContext, useState, useContext, useEffect } from "react";
import { webSocketService } from "../api/websocket";

export const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // Check for existing user data on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("userData");
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        // Clear corrupted data
        localStorage.removeItem("userData");
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
      }
    }
  }, []);

  const login = (userData) => {
    // Store complete user data in state and localStorage
    const userToStore = {
      _id: userData._id, // Make sure to include _id for WebSocket
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      token: userData.token || "dummy-token"
    };
    
    setUser(userToStore);
    localStorage.setItem("token", userToStore.token);
    localStorage.setItem("userEmail", userToStore.email);
    localStorage.setItem("userData", JSON.stringify(userToStore));
    
    // Connect WebSocket after successful login
    if (userToStore._id && userToStore.token) {
      webSocketService.connect(userToStore._id, userToStore.token);
    }
    
    console.log("User logged in and stored:", userToStore);
  };

  const logout = () => {
    // Disconnect WebSocket before logging out
    webSocketService.disconnect();
    
    setUser(null);
    setNotes([]);
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userData");
    console.log("User logged out, localStorage cleared");
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      setUser, 
      notes, 
      setNotes, 
      theme, 
      setTheme,
      login,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};
