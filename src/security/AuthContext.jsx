// src/security/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionCheckRef = useRef(null);
  const logoutNotificationRef = useRef(null);

  // isAuthenticated checks both user and token
  const isAuthenticated = !!user && !!token;

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (error) {
        clearAuthData();
      }
    }
    setLoading(false);
  }, []);

  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    // Clear session check interval
    if (sessionCheckRef.current) {
      clearInterval(sessionCheckRef.current);
      sessionCheckRef.current = null;
    }
  };

  const login = (userData, authToken) => {
    const userWithToken = {
      ...userData,
      token: authToken
    };
    
    setUser(userWithToken);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userWithToken));
    localStorage.setItem("token", authToken);
  };

  const logout = () => {
    clearAuthData();
  };

  // Session check function
  const checkSessionStatus = async () => {
    if (!token) return { valid: false };
    
    try {
      const response = await fetch('/.netlify/functions/checkSession', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        return { valid: false, message: "Another login was detected from a different device. You have been automatically logged out for security." };
      }
      
      return { valid: response.ok };
    } catch {
      return { valid: false, message: "Session check failed" };
    }
  };

  // Start session monitoring when user is logged in
  useEffect(() => {
    if (token && user) {
      // Clear any existing interval
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
      
      // Start new session monitoring
      sessionCheckRef.current = setInterval(async () => {
        const sessionStatus = await checkSessionStatus();
        if (!sessionStatus.valid) {
          // Show notification only once
          if (!logoutNotificationRef.current && sessionStatus.message) {
            logoutNotificationRef.current = true;
            
            // Show notification to user
            if (typeof window !== 'undefined') {
              alert(sessionStatus.message);
            }
            
            // Logout the user
            clearAuthData();
            
            // Clear notification flag after a delay
            setTimeout(() => {
              logoutNotificationRef.current = false;
            }, 1000);
          }
        }
      }, 30000); // Check every 30 seconds
      
      // Cleanup on unmount
      return () => {
        if (sessionCheckRef.current) {
          clearInterval(sessionCheckRef.current);
        }
      };
    } else {
      // Clear interval if user logs out
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
        sessionCheckRef.current = null;
      }
    }
  }, [token, user]);

  // Check session on token change
  useEffect(() => {
    if (token && user) {
      // Initial session check
      checkSessionStatus().then(sessionStatus => {
        if (!sessionStatus.valid && sessionStatus.message) {
          if (typeof window !== 'undefined') {
            alert(sessionStatus.message);
          }
          clearAuthData();
        }
      });
    }
  }, [token, user]);

  // Helper function for API calls
  const getToken = () => token;

  // Function to check token validity
  const validateToken = async () => {
    if (!token) return false;
    
    try {
      return await checkSessionStatus().then(status => status.valid);
    } catch {
      return false;
    }
  };

  // Function to logout from other devices
  const logoutOtherSessions = async () => {
    try {
      const response = await fetch('/.netlify/functions/logoutOtherSessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return { success: true, message: "Other sessions logged out successfully" };
      }
      return { success: false, message: "Failed to logout other sessions" };
    } catch (error) {
      return { success: false, message: "Error logging out other sessions" };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user: user ? { ...user, token: token } : null,
      token,
      isAuthenticated,
      login, 
      logout, 
      loading,
      getToken,
      validateToken,
      logoutOtherSessions
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};