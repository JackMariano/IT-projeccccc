import React from "react";

export default function VehicleTable({ vehicles = [] }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-300 flex-1 overflow-hidden flex flex-col min-h-0">
      <div className="hidden md:flex flex-col overflow-hidden flex-1">
        <div className="grid grid-cols-5 gap-4 p-4 bg-gray-100 border-b border-gray-300 font-semibold text-sm flex-shrink-0">
          <div className="flex items-center gap-2"><input type="checkbox" /> <span>Name</span></div>
          <div>Status</div>
          <div>Type</div>
          <div>Group</div>
          <div>Meter</div>
        </div>

        <div className="divide-y divide-gray-200 overflow-y-auto flex-1 min-h-0">
          {vehicles && vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <div key={vehicle.id} className="grid grid-cols-5 gap-4 p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <input type="checkbox" />
                  <div className="w-16 h-12 bg-gray-300 rounded flex-shrink-0"></div>
                  <div className="min-w-0">
                    <div className="font-bold truncate">{vehicle.name}</div>
                    <div className="text-sm text-gray-600 truncate">{vehicle.year} {vehicle.make}</div>
                    <div className="text-xs text-gray-500 truncate">Plate: {vehicle.plateNumber}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${vehicle.status === "Active" ? "bg-green-500" : "bg-red-500"}`}></div>
                    <span>{vehicle.status}</span>
                  </div>
                </div>
                <div className="flex items-center">{vehicle.type}</div>
                <div className="flex items-center">{vehicle.group}</div>
                <div className="flex items-center">
                  <div>
                    <div className="font-semibold">{vehicle.currentMeter}</div>
                    <div className="text-sm text-yellow-600">{vehicle.lastUpdate}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">No vehicles found</div>
          )}
        </div>
      </div>

      <div className="md:hidden divide-y divide-gray-200 overflow-y-auto flex-1 min-h-0">
        {vehicles && vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <div key={vehicle.id} className="p-4 hover:bg-gray-50">
              <div className="flex gap-3 mb-3">
                <input type="checkbox" className="mt-1" />
                <div className="w-14 h-10 bg-gray-300 rounded flex-shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">{vehicle.name}</div>
                  <div className="text-xs text-gray-600 truncate">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 ml-9 text-xs">
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-2 h-2 rounded-full ${vehicle.status === "Active" ? "bg-green-500" : "bg-red-500"}`}></div>
                    <span className="font-medium">{vehicle.status}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <div className="font-medium mt-1">{vehicle.type}</div>
                </div>
                <div>
                  <span className="text-gray-500">Plate:</span>
                  <div className="font-medium mt-1">{vehicle.plateNumber}</div>
                </div>
                <div>
                  <span className="text-gray-500">Meter:</span>
                  <div className="font-medium mt-1">{vehicle.currentMeter}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">No vehicles found</div>
        )}
      </div>
    </div>
  );
}
