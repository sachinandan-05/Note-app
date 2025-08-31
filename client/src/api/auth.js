export const loginUser = async (email, password) => {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
  
    if (res.ok) {
      console.log("Login API response:", data);
      return data; // Return the data so the component can handle it
    } else {
      throw new Error(data.message || "Login failed");
    }
  } catch (error) {
    console.error("Login API error:", error);
    throw error;
  }
};

export const registerUser = async (name, email, password) => {
  try {
    const res = await fetch("http://localhost:8000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    
    if (res.ok) {
      return data;
    } else {
      throw new Error(data.message || "Registration failed");
    }
  } catch (error) {
    console.error("Registration API error:", error);
    throw error;
  }
};