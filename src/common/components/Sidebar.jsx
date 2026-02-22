import React from "react";

const SidebarButton = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ease-in-out rounded-lg 
                text-sm font-medium  
                ${
                  isActive
                    ? "bg-[#e5b038] text-white"
                    : "text-gray-300 hover:bg-[#e5b038]/50 hover:text-white"
                }
                focus:outline-none focus:ring-2 focus:ring-amber-400`}
  >
    <span className="text-xl">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const adminNavItems = [
  { id: "dashboard", icon: "🏠", label: "Dashboard" },
  { id: "vehicles", icon: "🚗", label: "Vehicles" },
  { id: "inspection", icon: "📋", label: "Inspection" },
  { id: "issues", icon: "⚠️", label: "Issues" },
  { id: "parts", icon: "🔧", label: "Parts / Inventory" },
];

const driverNavItems = [
    { id: "dashboard", icon: "🏠", label: "Trips" },
    { id: "mileage", icon: "🛢️", label: "Mileage & Fuel" },
    { id: "issues", icon: "⚠️", label: "Vehicle Issues" },
];

const managerNavItems = [
    { id: "reservations", icon: "📋", label: "Reservations" },
    { id: "vehicles", icon: "🚗", label: "Vehicles" },
];

const shopNavItems = [
    { id: "reports", icon: "📋", label: "Reports" },
    { id: "inventory", icon: "🔧", label: "Inventory" },
];

const navItemsByRole = {
  admin: adminNavItems,
  driver: driverNavItems,
  manager: managerNavItems,
  shop: shopNavItems,
};


export default function Sidebar({ userRole, activeSection, onNavigate }) {

  const navItems = navItemsByRole[userRole] || [];

  return (
    <div className="w-full md:w-64 bg-[#0e2a47] text-white p-4 flex flex-col">
      <div className="flex items-center justify-center py-4 mb-4 border-b border-gray-700">
        <img src="/images/jmtc_logo.png" alt="Logo" className="w-32" />
      </div>

      <nav className="flex-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden">
        {navItems.map((item) => (
          <SidebarButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeSection === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>
    </div>
  );
}