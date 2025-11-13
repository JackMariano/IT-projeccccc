import React from "react";
import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  const sidebarStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: "250px",
    background: "#e5b038",
    color: "#fff",
    fontFamily: "Montserrat, sans-serif",
    zIndex: 200,
    display: "flex",
    flexDirection: "column",
    transition: "all 0.18s ease",
  };

  const sidebarHeaderStyle = {
    fontSize: "2rem",
    padding: "20px 16px",
    fontWeight: "bold",
    letterSpacing: "2px",
  };

  const sidebarMenuStyle = {
    marginTop: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "0",
  };

  const sidebarItemStyle = {
    padding: "18px 16px",
    fontSize: "1.2rem",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    transition: "background 0.2s",
  };

  const activeItemStyle = {
    ...sidebarItemStyle,
    background: "#d4a500",
  };

  const iconStyle = {
    marginRight: "12px",
    fontSize: "1.3rem",
  };

  const logoStyle = {
    marginBottom: "1rem",
  };

  const logoImgStyle = {
    height: "60px",
    width: "auto",
  };

  // Responsive handling
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth <= 900;

  const mobileSidebarStyle = {
    ...sidebarStyle,
    position: "relative",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: "8px 12px",
    gap: "12px",
    height: "auto",
  };

  const mobileLogoImgStyle = {
    height: "36px",
    width: "auto",
  };

  const mobileSidebarMenuStyle = {
    display: "flex",
    flexDirection: "row",
    gap: "8px",
    marginTop: 0,
  };

  const mobileSidebarItemStyle = {
    padding: "8px 10px",
    fontSize: "0.95rem",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  };

  const mobileIconStyle = {
    marginRight: "6px",
    fontSize: "1rem",
  };

  // --- Logout function ---
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token"); // If you saved the JWT in localStorage
      await fetch("/.netlify/functions/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Clear local storage
      localStorage.clear();

      // Redirect to login page
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Failed to logout. Please try again.");
    }
  };

  return (
    <div style={isMobile ? mobileSidebarStyle : sidebarStyle}>
      <div style={logoStyle}>
        <img
          src="/images/jmtc_logo.png"
          alt="JMTC Logo"
          style={isMobile ? mobileLogoImgStyle : logoImgStyle}
        />
      </div>
      <div style={isMobile ? mobileSidebarMenuStyle : sidebarMenuStyle}>
        <div style={activeItemStyle}>
          <span style={isMobile ? mobileIconStyle : iconStyle} role="img" aria-label="gear">
            ⚙️
          </span>
          Shop
        </div>
        <div
          style={isMobile ? mobileSidebarItemStyle : sidebarItemStyle}
          onClick={handleLogout}
        >
          <span style={isMobile ? mobileIconStyle : iconStyle} role="img" aria-label="logout">
            🔓
          </span>
          Logout
        </div>
      </div>
    </div>
  );
}
