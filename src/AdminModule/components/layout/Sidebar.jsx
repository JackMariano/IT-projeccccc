import React from "react";

export default function Sidebar({ activeSection, setActiveSection }) {
  return (
    <div className="w-full md:w-60 bg-[#0e2a47] text-white md:min-h-screen hover:bg-[#0e2a47]">
      <div className="p-4 md:p-6">
        <img src="/images/jmtc_logo.png" alt="Logo" className="w-24 md:w-32 object-contain" />
      </div>

      <nav className="mt-2 flex md:flex-col overflow-x-auto md:overflow-x-visible">
        <button
          onClick={() => setActiveSection("dashboard")}
          className={`flex-shrink-0 md:flex-1 md:w-full flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 text-left transition-colors text-sm md:text-base whitespace-nowrap ${
            activeSection === "dashboard" ? "bg-[#e5b038]" : "hover:bg-[#e5b038]"
          }`}
        >
          <span className="text-lg md:text-xl">🏠</span>
          <span className="hidden sm:inline font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveSection("vehicles")}
          className={`flex-shrink-0 md:flex-1 md:w-full flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 text-left transition-colors text-sm md:text-base whitespace-nowrap ${
            activeSection === "vehicles" ? "bg-[#e5b038]" : "hover:bg-[#e5b038]"
          }`}
        >
          <span className="text-lg md:text-xl">🚗</span>
          <span className="hidden sm:inline font-medium">Vehicles</span>
        </button>

        <button
          onClick={() => setActiveSection("inspection")}
          className={`flex-shrink-0 md:flex-1 md:w-full flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 text-left transition-colors text-sm md:text-base whitespace-nowrap ${
            activeSection === "inspection" ? "bg-[#e5b038]" : "hover:bg-[#e5b038]"
          }`}
        >
          <span className="text-lg md:text-xl">📋</span>
          <span className="hidden sm:inline font-medium">Inspection</span>
        </button>

        <button
          onClick={() => setActiveSection("issues")}
          className={`flex-shrink-0 md:flex-1 md:w-full flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 text-left transition-colors text-sm md:text-base whitespace-nowrap ${
            activeSection === "issues" ? "bg-[#e5b038]" : "hover:bg-[#e5b038]"
          }`}
        >
          <span className="text-lg md:text-xl">⚠️</span>
          <span className="hidden sm:inline font-medium">Issues</span>
        </button>

        <button
          onClick={() => setActiveSection("parts")}
          className={`flex-shrink-0 md:flex-1 md:w-full flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 text-left transition-colors text-sm md:text-base whitespace-nowrap ${
            activeSection === "parts" ? "bg-[#e5b038]" : "hover:bg-[#e5b038]"
          }`}
        >
          <span className="text-lg md:text-xl">🔧</span>
          <span className="hidden sm:inline font-medium">Parts / Inventory</span>
        </button>
      </nav>
    </div>
  );
}
