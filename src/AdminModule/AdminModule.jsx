import React, { useState } from "react";
import Sidebar from "../common/components/Sidebar";
import Header from "../common/components/Header";
import Dashboard from "./components/dashboard/Dashboard";
import VehiclesPage from "./components/vehicles/VehiclesPage";
import InspectionPage from "./components/inspection/InspectionPage.jsx";
import IssuesPage from "./components/issues/IssuesPage";
import InventoryPage from "./components/inventory/InventoryPage";

export default function AdminModule() {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
      <Sidebar userRole="admin" activeSection={activeSection} onNavigate={setActiveSection} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-200">
            {activeSection === "dashboard" && <Dashboard />}
            {activeSection === "vehicles" && <VehiclesPage />}
            {activeSection === "inspection" && <InspectionPage />}
            {activeSection === "issues" && <IssuesPage />}
            {activeSection === "parts" && <InventoryPage />}
        </main>
      </div>
    </div>
  );
}
