import React from "react";

export default function Sidebar({ active, onNavigate }) {
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
  });

  const iconStyle = {
    marginRight: "12px",
    fontSize: "1.3rem",
  };

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <img src="/images/jmtc_logo.png" alt="JMTC Logo" style={{ width: "100px" }} />
      </div>

      <div style={itemStyle(active === "dashboard")} onClick={() => onNavigate("dashboard")}>
        <span style={iconStyle}>🏠</span> Dashboard
      </div>

      <div style={itemStyle(active === "notifications")} onClick={() => onNavigate("notifications")}>
        <span style={iconStyle}>🔔</span> Notifications
      </div>

      <div style={itemStyle(active === "logout")} onClick={() => onNavigate("logout")}>
        <span style={iconStyle}>🔑</span> Logout
      </div>
    </div>
  );
}
