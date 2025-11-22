import React from "react";

export default function IssuesTable({ issues = [] }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-300 flex-1">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 p-3 md:p-4 border-b border-gray-300 font-semibold bg-gray-50 text-xs md:text-sm min-w-full">
        <div className="hidden sm:block">Name</div>
        <div>Issue</div>
        <div className="hidden md:block">Type</div>
        <div>Date</div>
        <div className="hidden sm:block">Time</div>
      </div>

      <div className="divide-y divide-gray-200">
        {issues.map((issue) => (
          <div key={issue.id} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 p-3 md:p-4 hover:bg-gray-50 text-xs md:text-sm">
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="w-10 h-8 md:w-16 md:h-12 bg-gray-300 rounded flex-shrink-0"></div>
                <div className="min-w-0">
                  <div className="font-bold truncate">{issue.vehicleId}</div>
                  <div className="text-xs text-gray-600 truncate">{issue.vehicleModel}</div>
                  <div className="text-xs text-gray-500 truncate">Plate: {issue.plateNumber}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center font-medium">{issue.issue}</div>
            <div className="hidden md:flex items-center text-xs md:text-sm">{issue.type}</div>
            <div className="flex items-center text-xs md:text-sm">{issue.date}</div>
            <div className="hidden sm:flex items-center text-xs md:text-sm">{issue.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
