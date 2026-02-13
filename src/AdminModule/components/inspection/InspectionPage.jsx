import React, { useState, useEffect } from "react";
import InspectionTable from "./InspectionTable";
import AddInspectionModal from "./AddInspectionModal";

export default function InspectionPage() {
  const [inspectionTab, setInspectionTab] = useState("all");
  const [inspectionFilters, setInspectionFilters] = useState({ vehicleType: "", inspectionType: "", scheduledDate: "" });
  const [showAddInspection, setShowAddInspection] = useState(false);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch inspection data (using vehicles as base for now)
  useEffect(() => {
    fetchInspectionData();
  }, []);

  const fetchInspectionData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/.netlify/functions/getInspections');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.inspections) {
        const formattedInspections = data.inspections.map((inspection) => {
          const scheduledDate = new Date(inspection.scheduled_date);
          return {
            id: inspection.inspection_id,
            vehicle_id: inspection.vehicle_id, // Store vehicle_id for later use if needed
            vehicleName: inspection.plate_number || `Vehicle ${inspection.vehicle_id}`,
            vehicleYear: inspection.year,
            vehicleMake: inspection.brand,
            vehicleModel: inspection.model,
            vin: inspection.vehicle_id.toString(), // Using vehicle_id as vin for now
            plateNumber: inspection.plate_number,
            type: inspection.vehicle_type || "Standard",
            inspectionType: inspection.inspection_type,
            scheduledDate: scheduledDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            status: inspection.status,
            odometer: inspection.odometer,
            issuesCount: 0 // Issues count will be derived elsewhere or fetched separately if needed
          };
        });
        setInspections(formattedInspections);
      }
    } catch (err) {
      console.error('Error fetching inspection data:', err);
      setError('Failed to load inspection data');
    } finally {
      setLoading(false);
    }
  };

  const filteredInspections = inspections.filter((inspection) => {
    return (
      (!inspectionFilters.vehicleType || (inspection.type || "").toLowerCase().includes(inspectionFilters.vehicleType.toLowerCase())) &&
      (!inspectionFilters.inspectionType || (inspection.inspectionType || "").toLowerCase().includes(inspectionFilters.inspectionType.toLowerCase())) &&
      (!inspectionFilters.scheduledDate || (inspection.scheduledDate || "").includes(inspectionFilters.scheduledDate))
    );
  });

  const handleAddInspection = () => {
    fetchInspectionData();
  };

  if (loading) {
    return (
      <div className="p-3 md:p-8 overflow-auto flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inspections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 md:p-8 overflow-auto flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchInspectionData}
            className="bg-cyan-500 text-white px-4 py-2 rounded-md hover:bg-cyan-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-8 overflow-auto flex-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <h2 className="text-2xl md:text-4xl font-bold">Inspection</h2>
        <button onClick={() => setShowAddInspection(true)} className="bg-yellow-500 text-white px-4 md:px-6 py-2 rounded-md hover:bg-yellow-600 flex items-center gap-2 font-medium text-sm md:text-base whitespace-nowrap">
          <span>+</span>
          <span>Add Inspection</span>
        </button>
      </div>

      <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto">
        <button onClick={() => setInspectionTab("all")} className={`px-4 md:px-6 py-2 rounded-full text-sm md:text-base whitespace-nowrap ${inspectionTab === "all" ? "bg-cyan-500 text-white" : "bg-gray-200"}`}>All</button>
        <button onClick={() => setInspectionTab("archived")} className={`px-3 md:px-4 py-2 rounded-full text-sm md:text-base whitespace-nowrap ${inspectionTab === "archived" ? "bg-cyan-500 text-white" : "bg-gray-200"} flex items-center gap-1`}>
          <span>📁</span><span className="hidden sm:inline">Archived</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mb-4">
        <input type="text" placeholder="Filter vehicle types" value={inspectionFilters.vehicleType} onChange={(e) => setInspectionFilters({ ...inspectionFilters, vehicleType: e.target.value })} className="px-3 md:px-4 py-2 border border-gray-300 rounded-md flex-1 text-sm md:text-base" />
        <input type="text" placeholder="Filter inspection type" value={inspectionFilters.inspectionType} onChange={(e) => setInspectionFilters({ ...inspectionFilters, inspectionType: e.target.value })} className="px-3 md:px-4 py-2 border border-gray-300 rounded-md flex-1 text-sm md:text-base" />
        <input type="text" placeholder="Filter scheduled date" value={inspectionFilters.scheduledDate} onChange={(e) => setInspectionFilters({ ...inspectionFilters, scheduledDate: e.target.value })} className="px-3 md:px-4 py-2 border border-gray-300 rounded-md flex-1 text-sm md:text-base" />
        <button className="px-3 md:px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center gap-2 text-sm md:text-base whitespace-nowrap"><span>☰</span><span className="hidden sm:inline">More</span></button>
        <button className="px-4 md:px-6 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 flex items-center gap-2 text-sm md:text-base whitespace-nowrap"><span>🔍</span><span className="hidden sm:inline">Search</span></button>
      </div>

      <div className="text-xs md:text-sm text-gray-600 mb-4">0 filters applied</div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 mb-4">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="text-xs md:text-sm text-gray-600">0 selected:</div>
          <button className="px-3 md:px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm"><span>Update</span><span>▼</span></button>
          <button className="p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">📄</button>
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm flex-wrap"><div>Sort: <select className="border border-gray-300 rounded px-2 py-1 text-xs md:text-sm"><option>Updated - Newest First</option></select></div><div>1-{filteredInspections.length} of {filteredInspections.length}</div></div>
      </div>

      <InspectionTable inspections={filteredInspections} />

      {showAddInspection && <AddInspectionModal onClose={() => setShowAddInspection(false)} onAdd={handleAddInspection} />}
    </div>
  );
}
