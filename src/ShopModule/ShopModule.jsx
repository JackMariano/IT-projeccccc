// components/modules/ShopModule.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";
import Reports from "./Reports";
import Inventory from "./Inventory";

export default function ShopModule() {
  const [activeSection, setActiveSection] = useState("reports");

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#f5f5f5",
    overflow: "hidden", // Keep overflow hidden for container
  };

  const contentStyle = {
    display: "flex",
    height: "calc(100vh - 70px)",
    marginTop: "70px",
  };

  const mainContentStyle = {
    flex: 1,
    padding: "20px",
    marginLeft: "250px",
    width: "calc(100% - 250px)",
    boxSizing: "border-box",
    // Different overflow based on active section
    overflow: activeSection === "inventory" ? "auto" : "auto",
    height: activeSection === "inventory" ? "auto" : "calc(100vh - 70px)",
    minHeight: activeSection === "inventory" ? "auto" : "auto",
  };

  return (
    <div style={containerStyle}>
      <HeaderBar />
      <div style={contentStyle}>
        <Sidebar 
          active={activeSection}
          onNavigate={setActiveSection}
        />
        <div style={mainContentStyle}>
          {activeSection === "reports" && <Reports />}
          {activeSection === "inventory" && <Inventory />}
        </div>
      </div>
    </div>
  );
}