import React from "react";

export default function Sidebar({ onLogout }) {
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
    background: "#e5b038",
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

  // Responsive styles (inline, applied via window width check)
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

  const mobileSidebarHeaderStyle = {
    ...sidebarHeaderStyle,
    fontSize: "1.1rem",
    padding: "8px 0",
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

  const mobileLogoImgStyle = {
    height: "36px",
    width: "auto",
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
        <div style={isMobile ? mobileSidebarItemStyle : sidebarItemStyle} onClick={onLogout}>
          <span style={isMobile ? mobileIconStyle : iconStyle} role="img" aria-label="logout">
            🔓
          </span>
          Logout
        </div>
      </div>
    </div>
  );
}
