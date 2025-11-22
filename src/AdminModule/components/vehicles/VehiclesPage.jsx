import React, { useState } from "react";
import VehicleTable from "./VehicleTable";
import AddVehicleModal from "./AddVehicleModal";

const initialVehicles = [
  {
    id: 1,
    name: "PW-1",
    year: "2014",
    make: "Ram",
    model: "Ram Pickup 1500",
    vin: "1C6RR7GT8ES176075",
    plateNumber: "1A13212",
    rfidBalance: "20000",
    status: "Active",
    type: "Suv",
    group: "Company",
    currentMeter: "12,231",
    lastUpdate: "3 Months Ago",
  },
  {
    id: 2,
    name: "LE-4",
    year: "2021",
    make: "Toyota",
    model: "Hiace",
    vin: "1C6RR7GT8ES176075",
    plateNumber: "1A13333",
    rfidBalance: "20000",
    status: "Out Of Service",
    type: "Van",
    group: "Public works",
    currentMeter: "12,231",
    lastUpdate: "3 Months Ago",
  },
  // ... you can copy the rest from original if you want
];

export default function VehiclesPage() {
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [vehicleFilters, setVehicleFilters] = useState({
    year: "",
    make: "",
    model: "",
    trim: "",
    fuelType: "",
    currentMeter: "",
  });
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicles, setVehicles] = useState(initialVehicles);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.name.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(vehicleSearchQuery.toLowerCase());

    const matchesFilters =
      (!vehicleFilters.year || vehicle.year.includes(vehicleFilters.year)) &&
      (!vehicleFilters.make ||
        vehicle.make.toLowerCase().includes(vehicleFilters.make.toLowerCase())) &&
      (!vehicleFilters.model ||
        vehicle.model.toLowerCase().includes(vehicleFilters.model.toLowerCase())) &&
      (!vehicleFilters.currentMeter ||
        vehicle.currentMeter.includes(vehicleFilters.currentMeter));

    return matchesSearch && matchesFilters;
  });

  const handleAddVehicle = (newVehicle) => {
    setVehicles((v) => [{ ...newVehicle, id: v.length + 1 }, ...v]);
    setShowAddVehicle(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-cyan-600 p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
        <input
          type="text"
          placeholder="Search vehicles and contacts..."
          value={vehicleSearchQuery}
          onChange={(e) => setVehicleSearchQuery(e.target.value)}
          className="flex-1 px-3 md:px-4 py-2 rounded-md border-none text-sm md:text-base"
        />
        <button className="bg-yellow-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-yellow-600 flex-shrink-0">🔍</button>
        <div className="flex items-center gap-2 md:gap-4 text-white text-xs md:text-sm">
          <button className="flex items-center gap-1 whitespace-nowrap">
            <span>❓</span>
            <span className="hidden sm:inline">Help</span>
            <span>▼</span>
          </button>
          <button className="flex items-center gap-1 whitespace-nowrap">
            <span className="hidden sm:inline">JMTC</span>
            <span>▼</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 border-b overflow-x-auto pb-2 flex-shrink-0">
          <button className="pb-2 px-1 md:px-2 font-medium text-xs md:text-base whitespace-nowrap border-b-2 border-blue-500">Vehicle List</button>
          <button className="pb-2 px-1 md:px-2 text-gray-400 text-xs md:text-base whitespace-nowrap">Watched Vehicles</button>
          <button className="pb-2 px-1 md:px-2 text-gray-400 text-xs md:text-base whitespace-nowrap">GPS Devices</button>
        </div>

        <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-6 flex-shrink-0">Vehicle List</h2>

        <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mb-4 flex-wrap flex-shrink-0">
          <input type="text" placeholder="Search names, VINs" className="px-3 md:px-4 py-2 border border-gray-300 rounded-md flex-1 text-xs md:text-base" />
          <input type="text" placeholder="Filter vehicle types" className="px-3 md:px-4 py-2 border border-gray-300 rounded-md flex-1 text-xs md:text-base" />
          <input type="text" placeholder="Filter groups" className="px-3 md:px-4 py-2 border border-gray-300 rounded-md flex-1 text-xs md:text-base" />
          <input type="text" placeholder="Filter statuses" className="px-3 md:px-4 py-2 border border-gray-300 rounded-md flex-1 text-xs md:text-base" />
          <button className="px-3 md:px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center gap-2 text-xs md:text-base whitespace-nowrap">
            <span>☰</span>
            <span className="hidden sm:inline">More</span>
          </button>
          <button className="px-4 md:px-6 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 text-xs md:text-base whitespace-nowrap">🔍 Search</button>
        </div>

        <div className="text-xs md:text-sm text-gray-600 mb-4 flex-shrink-0">0 filters applied</div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 mb-4 flex-wrap flex-shrink-0">
          <div className="flex gap-2 flex-wrap">
            <div className="text-xs md:text-sm text-gray-600 whitespace-nowrap">0 selected:</div>
            <button className="px-3 md:px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm">
              <span>Update</span>
              <span>▼</span>
            </button>
            <button className="p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">📄</button>
            <button className="px-3 md:px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
              <span>🖨️</span>
              <span className="hidden sm:inline">Print Labels</span>
            </button>
            <button className="px-3 md:px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
              <span>☰</span>
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm flex-wrap">
            <div className="whitespace-nowrap">Sort: <select className="border border-gray-300 rounded px-2 py-1 text-xs md:text-sm"><option>Updated - Newest First</option></select></div>
            <div className="whitespace-nowrap">1-31 of 31</div>
            <button onClick={() => setShowAddVehicle(true)} className="px-4 md:px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2 font-medium text-xs md:text-base whitespace-nowrap">
              <span>+</span>
              <span className="hidden sm:inline">Add Vehicle</span>
            </button>
          </div>
        </div>

        <VehicleTable vehicles={filteredVehicles} />

        {showAddVehicle && <AddVehicleModal onClose={() => setShowAddVehicle(false)} onAdd={handleAddVehicle} />}
      </div>
    </div>
  );
}
