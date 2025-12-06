// src/security/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user exists
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if specified - match EXACT case
  if (allowedRoles.length > 0) {
    const userRole = user.role; // This should be "Admin", "Driver", "Shop"
    
    if (!allowedRoles.includes(userRole)) {
      // Redirect based on actual role
      if (userRole === "Admin") return <Navigate to="/admin" replace />;
      if (userRole === "Driver") return <Navigate to="/driver" replace />;
      if (userRole === "Shop") return <Navigate to="/shop" replace />;
      
      // Default fallback
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}