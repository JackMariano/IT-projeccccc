import React, { useState, useEffect } from "react";
import VehicleTable from "./VehicleTable";
import AddVehicleModal from "./AddVehicleModal";

export default function VehiclesPage() {
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [vehicleFilters, setVehicleFilters] = useState({ status: "" });
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch vehicles on component mount and whenever the tab regains focus
  useEffect(() => {
    fetchVehicles();
    const handleVisibility = () => { if (!document.hidden) fetchVehicles(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/.netlify/functions/getVehicles');
      const data = await response.json();
      
      if (data.vehicles) {
        // Transform API data to match the expected format
        const formattedVehicles = data.vehicles.map((vehicle) => ({
          id: vehicle.vehicle_id,
          name: `${vehicle.brand || ""} ${vehicle.model || ""}`.trim() || vehicle.plate_number,
          make: vehicle.brand || "Unknown",
          model: vehicle.model || "Unknown",
          vin: vehicle.vehicle_id.toString(),
          plateNumber: vehicle.plate_number || "",
          status: vehicle.status || "available",
          type: vehicle.vehicle_type || "Unknown",
          group: "Company",
          currentMeter: vehicle.odometer ? Number(vehicle.odometer).toLocaleString() : "0",
          lastUpdate: "Recently",
        }));
        
        setVehicles(formattedVehicles);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const q = vehicleSearchQuery.toLowerCase();
    const matchesSearch =
      vehicle.name.toLowerCase().includes(q) ||
      vehicle.model.toLowerCase().includes(q) ||
      (vehicle.plateNumber || "").toLowerCase().includes(q) ||
      vehicle.vin.toLowerCase().includes(q);

    const matchesStatus =
      !vehicleFilters.status ||
      (vehicle.status || "").toLowerCase() === vehicleFilters.status;

    return matchesSearch && matchesStatus;
  });

  const handleAddVehicle = async (newVehicle) => {
    try {
      const response = await fetch('/.netlify/functions/createVehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicle),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || 'Failed to add vehicle');
        return;
      }

      setShowAddVehicle(false);
      await fetchVehicles();
    } catch (err) {
      console.error('Error adding vehicle:', err);
      alert('Failed to add vehicle');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchVehicles}
            className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
          <input
            type="text"
            placeholder="Search name, plate, model..."
            value={vehicleSearchQuery}
            onChange={(e) => setVehicleSearchQuery(e.target.value)}
            className="px-3 md:px-4 py-2 border border-gray-300 rounded-md flex-1 text-xs md:text-base"
          />
          <select
            value={vehicleFilters.status}
            onChange={(e) => setVehicleFilters({ ...vehicleFilters, status: e.target.value })}
            className="px-3 md:px-4 py-2 border border-gray-300 rounded-md text-xs md:text-base"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="in use">In Use</option>
            <option value="under repair">Under Repair</option>
            <option value="for inspection">For Inspection</option>
            <option value="in_shop">In Shop</option>
            <option value="finished repair">Finished Repair</option>
          </select>
        </div>

        <div className="text-xs md:text-sm text-gray-600 mb-4 flex-shrink-0">
          {(vehicleSearchQuery ? 1 : 0) + (vehicleFilters.status ? 1 : 0)} filters applied
        </div>

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
            <div className="whitespace-nowrap">1-{filteredVehicles.length} of {filteredVehicles.length}</div>
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
