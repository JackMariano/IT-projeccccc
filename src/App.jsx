// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./security/AuthContext";
import ProtectedRoute from "./security/ProtectedRoute";

import Login from "./LandingPage/Login";
import Dashboard from "./DriverModule/Dashboard";
import ShopModule from "./ShopModule/ShopModule";
import AdminModule from "./AdminModule/AdminModule";
import ManagerModule from "./ManagerModule/ManagerModule";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Driver route - only accessible to users with driver role */}
          <Route 
            path="/driver/*" 
            element={
              <ProtectedRoute allowedRoles={["Driver"]}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Shop route - only accessible to users with shop role */}
          <Route 
            path="/shop/*" 
            element={
              <ProtectedRoute allowedRoles={["Shop"]}>
                <ShopModule />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin route - only accessible to users with admin role */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminModule />
              </ProtectedRoute>
            } 
          />

          {/* Manager route - only accessible to users with manager role */}
          <Route 
            path="/manager/*" 
            element={
              <ProtectedRoute allowedRoles={["Manager"]}>
                <ManagerModule />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect root to appropriate dashboard based on user role */}
          <Route 
            path="/" 
            element={<RoleBasedRedirect />} 
          />
          
          {/* Catch-all route - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Component to redirect based on user role
function RoleBasedRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "Admin":
    case "admin":
      return <Navigate to="/admin" replace />;
    case "Driver":
    case "driver":
      return <Navigate to="/driver" replace />;
    case "Shop":
    case "shop":
      return <Navigate to="/shop" replace />;
    case "Manager":
    case "manager":
      return <Navigate to="/manager" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

// You need to import useAuth for RoleBasedRedirect component
import { useAuth } from "./security/AuthContext";

export default App;