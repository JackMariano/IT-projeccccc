// components/Notification.jsx
import React, { useState, useEffect } from "react";

export default function Notification({ message, type = "info", duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-close after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Manual close
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          background: "#d4edda",
          borderColor: "#c3e6cb",
          color: "#155724",
          icon: "✅"
        };
      case "error":
        return {
          background: "#f8d7da",
          borderColor: "#f5c6cb",
          color: "#721c24",
          icon: "❌"
        };
      case "warning":
        return {
          background: "#fff3cd",
          borderColor: "#ffeaa7",
          color: "#856404",
          icon: "⚠️"
        };
      case "info":
      default:
        return {
          background: "#d1ecf1",
          borderColor: "#bee5eb",
          color: "#0c5460",
          icon: "ℹ️"
        };
    }
  };

  const styles = getTypeStyles();

  const notificationStyle = {
    position: "fixed",
    top: "20px",
    right: "20px",
    minWidth: "300px",
    maxWidth: "400px",
    padding: "16px 20px",
    background: styles.background,
    border: `1px solid ${styles.borderColor}`,
    borderRadius: "8px",
    color: styles.color,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 9999,
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateX(0)" : "translateX(100%)",
    transition: "all 0.3s ease",
    fontFamily: "Arial, sans-serif",
  };

  const iconStyle = {
    fontSize: "1.2rem",
    flexShrink: 0,
  };

  const messageStyle = {
    flex: 1,
    fontSize: "0.95rem",
    lineHeight: "1.4",
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    color: "inherit",
    fontSize: "1.2rem",
    cursor: "pointer",
    padding: "0",
    marginLeft: "8px",
    opacity: 0.7,
    transition: "opacity 0.2s",
  };

  return (
    <div style={notificationStyle}>
      <span style={iconStyle}>{styles.icon}</span>
      <div style={messageStyle}>{message}</div>
      <button
        style={closeButtonStyle}
        onClick={handleClose}
        onMouseEnter={(e) => e.target.style.opacity = "1"}
        onMouseLeave={(e) => e.target.style.opacity = "0.7"}
      >
        ×
      </button>
    </div>
  );
}