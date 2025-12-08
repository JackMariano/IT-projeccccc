// components/layout/Sidebar.jsx (Shop Module version)
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";

export default function Sidebar({ active, onNavigate }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const sidebarStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: "250px",
    background: "#0e2a47",
    color: "#fff",
    fontFamily: "Montserrat, sans-serif",
    display: "flex",
    flexDirection: "column",
    zIndex: 200,
    transition: "all 0.2s ease",
  };

  const headerStyle = {
    fontSize: "2rem",
    padding: "20px 16px",
    fontWeight: "bold",
    letterSpacing: "2px",
    textAlign: "center",
  };

  const itemStyle = (isActive) => ({
    padding: "18px 16px",
    fontSize: "1.2rem",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    transition: "background 0.2s",
    background: isActive ? "#e5b038" : "transparent",
    color: "#fff",
  });

  const iconStyle = {
    marginRight: "12px",
    fontSize: "1.3rem",
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login", { replace: true });
    }
  };

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <img src="/images/jmtc_logo.png" alt="JMTC Logo" style={{ width: "100px" }} />
      </div>

      {/* Reports Section */}
      <div
        style={itemStyle(active === "reports")}
        onClick={() => onNavigate("reports")}
      >
        <span style={iconStyle}>📋</span> Reports
      </div>

      {/* Dashboard Section (Optional - for future development) */}
      {/* <div
        style={itemStyle(active === "dashboard")}
        onClick={() => onNavigate("dashboard")}
      >
        <span style={iconStyle}>📊</span> Dashboard
      </div> */}

      {/* Vehicles Section (Optional - for future development) */}
      {/* <div
        style={itemStyle(active === "vehicles")}
        onClick={() => onNavigate("vehicles")}
      >
        <span style={iconStyle}>🚗</span> Vehicles
      </div> */}

      {/* Inspection Section (Optional - for future development) */}
      {/* <div
        style={itemStyle(active === "inspection")}
        onClick={() => onNavigate("inspection")}
      >
        <span style={iconStyle}>🔍</span> Inspection
      </div> */}

      {/* Parts Inventory Section (Optional - for future development) */}
      {/* <div
        style={itemStyle(active === "parts")}
        onClick={() => onNavigate("parts")}
      >
        <span style={iconStyle}>🔧</span> Parts Inventory
      </div> */}

      {/* Logout */}
      <div
        style={itemStyle(active === "logout")}
        onClick={handleLogout}
      >
        <span style={iconStyle}>🔑</span> Logout
      </div>
    </div>
  );
}