import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";

export default function Sidebar({ active, onNavigate }) {
  const navigate = useNavigate();
  const { user } = useAuth();

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
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await fetch("/.netlify/functions/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.clear();
        navigate("/");
      } else {
        alert(data.message || "Failed to logout");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <img src="/images/jmtc_logo.png" alt="JMTC Logo" style={{ width: "100px" }} />
      </div>

      <div
        style={itemStyle(active === "dashboard")}
        onClick={() => onNavigate("dashboard")}
      >
        <span style={iconStyle}>🏠</span> Trips
      </div>

      {/* Mileage & Fuel Reporting */}
      <div
        style={itemStyle(active === "mileage")}
        onClick={() => onNavigate("mileage")}
      >
        <span style={iconStyle}>🛢️</span> Mileage & Fuel
      </div>

      {/* Vehicle Issue Reporting */}
      <div
        style={itemStyle(active === "issues")}
        onClick={() => onNavigate("issues")}
      >
        <span style={iconStyle}>⚠️</span> Vehicle Issues
      </div>

      {/* RFID Section */}
      <div
        style={itemStyle(active === "rfid")}
        onClick={() => onNavigate("rfid")}
      >
        <span style={iconStyle}>📡</span> RFID
      </div>

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