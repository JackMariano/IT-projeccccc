import React, { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import Dashboard from "./components/dashboard/Dashboard";
import VehiclesPage from "./components/vehicles/VehiclesPage";
import InspectionPage from "./components/inspection/InspectionPage.jsx";
import IssuesPage from "./components/issues/IssuesPage";
import InventoryPage from "./components/inventory/InventoryPage";

export default function AdminModule() {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-300">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 overflow-auto flex flex-col">
        <Topbar />
        {/* Section switch (keeps same behavior as original) */}
        {activeSection === "dashboard" && <Dashboard />}
        {activeSection === "vehicles" && <VehiclesPage />}
        {activeSection === "inspection" && <InspectionPage />}
        {activeSection === "issues" && <IssuesPage />}
        {activeSection === "parts" && <InventoryPage />}
      </div>
    </div>
  );
}
