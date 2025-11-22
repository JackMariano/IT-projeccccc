import React from "react";

export default function InspectionTable({ inspections = [] }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-300">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 p-3 md:p-4 bg-gray-100 border-b border-gray-300 font-semibold text-xs md:text-sm min-w-full">
        <div className="flex items-center gap-2"><input type="checkbox" /><span className="hidden sm:inline">Name</span></div>
        <div className="hidden sm:block">Type</div>
        <div className="hidden md:block">Inspection Type</div>
        <div>Scheduled Date</div>
        <div className="hidden sm:block">Status</div>
      </div>

      <div className="divide-y divide-gray-200">
        {inspections.map((inspection) => (
          <div key={inspection.id} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 p-3 md:p-4 hover:bg-gray-50 text-xs md:text-sm">
            <div className="flex items-center gap-2 md:gap-3">
              <input type="checkbox" />
              <div className="w-10 h-8 md:w-16 md:h-12 bg-gray-300 rounded flex-shrink-0"></div>
              <div className="min-w-0">
                <div className="font-bold truncate">{inspection.vehicleName}</div>
                <div className="text-xs text-gray-600 truncate hidden sm:block">{inspection.vehicleYear} {inspection.vehicleMake}</div>
              </div>
            </div>
            <div className="hidden sm:flex items-center text-xs md:text-sm">{inspection.type}</div>
            <div className="hidden md:flex items-center text-xs md:text-sm">{inspection.inspectionType}</div>
            <div className="flex items-center text-xs md:text-sm">{inspection.scheduledDate}</div>
            <div className="hidden sm:flex items-center text-xs md:text-sm">{inspection.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
