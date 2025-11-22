import React from "react";

export default function Topbar() {
  return (
    <div className="bg-cyan-500 p-3 md:p-4 flex items-center justify-between flex-shrink-0">
      <div className="w-12 md:w-16 h-12 md:h-16 bg-white rounded-lg flex items-center justify-center">
        <span className="text-2xl md:text-4xl">🚗</span>
      </div>

      <div className="w-10 md:w-12 h-10 md:h-12 bg-blue-400 rounded-full overflow-hidden flex-shrink-0">
        <img src="https://via.placeholder.com/48" alt="Profile" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
