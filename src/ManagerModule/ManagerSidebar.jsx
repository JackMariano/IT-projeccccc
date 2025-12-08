import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";

export default function ManagerSidebar({ active, onNavigate }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
    fontSize: "1.5rem",
    padding: "16px 12px",
    fontWeight: "bold",
    letterSpacing: "1px",
    textAlign: "center",
    flexShrink: 0,
  };

  const navContainerStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
  };

  const itemStyle = (isActive) => ({
    padding: "12px 14px",
    fontSize: "0.95rem",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    transition: "background 0.2s",
    background: isActive ? "#e5b038" : "transparent",
    color: "#fff",
    borderLeft: isActive ? "4px solid #fff" : "4px solid transparent",
  });

  const iconStyle = {
    marginRight: "10px",
    fontSize: "1.1rem",
  };

  const logoutButtonStyle = {
    padding: "12px 14px",
    fontSize: "0.95rem",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    transition: "background 0.2s",
    background: "transparent",
    color: "#fff",
    border: "none",
    width: "100%",
    textAlign: "left",
    marginTop: "auto",
    borderTop: "1px solid rgba(255,255,255,0.2)",
    flexShrink: 0,
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <img src="/images/jmtc_logo.png" alt="JMTC Logo" style={{ width: "80px" }} />
      </div>

      <div style={navContainerStyle}>
        <div style={itemStyle(active === "reservations")} onClick={() => onNavigate("reservations")}>
          <span style={iconStyle}>📋</span> Reservations
        </div>

        <div style={itemStyle(active === "vehicles")} onClick={() => onNavigate("vehicles")}>
          <span style={iconStyle}>🚗</span> Vehicles
        </div>
      </div>

      <button
        style={logoutButtonStyle}
        onClick={handleLogout}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "rgba(229, 176, 56, 0.2)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <span style={iconStyle}>🔑</span> Logout
      </button>
    </div>
  );
}