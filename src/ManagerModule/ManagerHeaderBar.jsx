import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";

export default function ManagerHeaderBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const headerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "60px",
    background: "#0e2a47",
    color: "#fff",
    fontFamily: "Montserrat, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    zIndex: 100,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  };

  const userInfoStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const userNameStyle = {
    fontSize: "0.9rem",
    fontWeight: "600",
  };

  const logoutButtonStyle = {
    padding: "6px 14px",
    background: "transparent",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
    transition: "all 0.2s",
  };

  const logoStyle = {
    fontSize: "1.2rem",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "10px",
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
    <div style={headerStyle}>
      <div style={logoStyle}>
        <img src="/images/jmtc_logo.png" alt="JMTC Logo" style={{ height: "35px" }} />
        <span style={{ fontSize: "1rem" }}>Manager Portal</span>
      </div>

      <div style={userInfoStyle}>
        <span style={userNameStyle}>
          {user?.name || user?.username || "Manager"}
        </span>
        <button
          style={logoutButtonStyle}
          onClick={handleLogout}
          onMouseOver={(e) => {
            e.target.style.background = "rgba(255,255,255,0.1)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "transparent";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}