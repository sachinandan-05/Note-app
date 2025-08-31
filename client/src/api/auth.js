// Base API URL for the Node.js server
const API_BASE_URL = 'http://localhost:8000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  
  return data;
};

export const loginUser = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    
    const data = await handleResponse(res);
    
    // Validate response data structure
    if (!data.user || !data.token) {
      throw new Error('Invalid response from server');
    }
    
    // Store user data in localStorage for WebSocket and auth persistence
    localStorage.setItem('userId', data.user._id);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    console.log('Login successful, user data stored');
    
    return {
      ...data.user,
      token: data.token
    };
    
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      status: error.status,
      data: error.data
    });
    
    // Provide more specific error messages
    if (error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
    
    throw new Error(error.data?.message || 'Login failed. Please try again.');
  }
};

export const registerUser = async (name, email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for session management
      body: JSON.stringify({ name, email, password }),
    });
    
    const data = await handleResponse(res);
    
    // Validate response data structure
    if (!data.user || !data.token) {
      throw new Error('Invalid response from server');
    }
    
    console.log('Registration successful, user data:', { 
      id: data.user._id, 
      email: data.user.email 
    });
    
    return {
      ...data.user,
      token: data.token
    };
    
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      status: error.status,
      data: error.data
    });
    
    // Provide more specific error messages
    if (error.status === 409) {
      throw new Error('An account with this email already exists.');
    }
    
    if (error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
    
    throw new Error(error.data?.message || 'Registration failed. Please try again.');
  }
};

// Add a function to validate the user's session
export const validateSession = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/validate`, {
      method: 'GET',
      credentials: 'include',
    });
    
    const data = await handleResponse(res);
    return data.valid ? data.user : null;
    
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
};

// Add a function to log out
export const logoutUser = async () => {
  try {
    // Clear stored credentials
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    
    // Disconnect WebSocket
    const { webSocketService } = await import('./websocket');
    webSocketService.disconnect();
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};