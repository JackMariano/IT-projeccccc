import React, { useState } from "react";
import Sidebar from "../common/components/Sidebar";
import Header from "../common/components/Header";
import Reports from "./Reports";
import Inventory from "./Inventory";

export default function ShopModule() {
  const [activeSection, setActiveSection] = useState("reports");

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
      <Sidebar userRole="shop" activeSection={activeSection} onNavigate={setActiveSection} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeSection === "reports" && <Reports />}
          {activeSection === "inventory" && <Inventory />}
        </main>
      </div>
    </div>
  );
}