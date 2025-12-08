// components/layout/HeaderBar.jsx (Shop Module version - Simplified)
import React from "react";
import { useAuth } from "../security/AuthContext";

export default function HeaderBar() {
  const { user } = useAuth();

  const headerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "70px",
    background: "#0e2a47",
    color: "#fff",
    fontFamily: "Montserrat, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    zIndex: 100,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  };

  const userInfoStyle = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  };

  const userNameStyle = {
    fontSize: "1rem",
    fontWeight: "600",
  };

  const userRoleStyle = {
    fontSize: "0.8rem",
    color: "#e5b038",
    fontWeight: "500",
    textTransform: "capitalize",
  };

  const logoStyle = {
    fontSize: "1.5rem",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  return (
    <div style={headerStyle}>
      <div style={logoStyle}>
        <img src="/images/jmtc_logo.png" alt="JMTC Logo" style={{ height: "40px" }} />
        <span>JMTC Shop Portal</span>
      </div>
      
      <div style={userInfoStyle}>
        <div style={{ textAlign: "right" }}>
          <div style={userNameStyle}>
            {user?.name || user?.email || user?.username || "Shop User"}
          </div>
          <div style={userRoleStyle}>
            {user?.role || "shop"} • Shop Module
          </div>
        </div>
      </div>
    </div>
  );
}