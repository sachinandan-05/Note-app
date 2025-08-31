import React from "react";
import { AppProvider } from "./context/appContext";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Login from "./components/Login";
import Profile from "./components/Profile";
import Register from "./components/register";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Hero from "./components/layout/Hero";
import Navbar from "./components/layout/Nav";
import Footer from "./components/layout/Footer";

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {isLandingPage && <Hero />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
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
