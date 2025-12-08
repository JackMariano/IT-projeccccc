// components/modules/ShopModule.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";
import Reports from "./Reports";

export default function ShopModule() {
  const [activeSection, setActiveSection] = useState("reports");

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
  };

  const contentStyle = {
    flex: 1,
    display: "flex",
    marginTop: "70px", // HeaderBar height
  };

  const mainContentStyle = {
    flex: 1,
    padding: "20px",
    overflow: "auto",
    marginLeft: "250px", // Sidebar width
    width: "calc(100% - 250px)",
    boxSizing: "border-box",
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
          {/* Add more sections here as you develop them */}
          {/* 
          {activeSection === "dashboard" && <Dashboard />}
          {activeSection === "vehicles" && <VehiclesPage />}
          {activeSection === "inspection" && <InspectionPage />}
          {activeSection === "parts" && <InventoryPage />}
          */}
        </div>
      </div>
    </div>
  );
}