import React, { useState, useEffect } from "react";

export default function AddInspectionModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    selectedVehicleId: null, // New field to store the selected vehicle's ID
    vehicleName: "",
    type: "",
    inspectionType: "",
    scheduledDate: "",
    status: "Scheduled",
  });
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    fetch("/.netlify/functions/getVehicles")
      .then((r) => r.json())
      .then((data) => {
        setVehicles(data.vehicles || []);
      })
      .catch(() => setVehicles([]))
      .finally(() => setLoadingVehicles(false));
  }, []);

  const handleVehicleChange = (e) => {
    const selectedId = parseInt(e.target.value, 10);
    const vehicle = vehicles.find((v) => v.vehicle_id === selectedId);
    if (vehicle) {
      setForm((f) => ({
        ...f,
        selectedVehicleId: vehicle.vehicle_id, // Store the vehicle_id
        vehicleName: vehicle.plate_number || `Vehicle ${vehicle.vehicle_id}`,
        type: vehicle.vehicle_type || "Standard",
      }));
    } else {
      setForm((f) => ({ ...f, vehicleName: "", type: "" }));
    }
  };

  const submit = async () => {
    try {
      const payload = {
        vehicle_id: form.selectedVehicleId,
        inspection_type: form.inspectionType,
        scheduled_date: form.scheduledDate,
        status: form.status,
        odometer: null, // Add odometer if it becomes a field in the modal
      };

      const response = await fetch('/.netlify/functions/addInspection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json(); // Parse response if needed, for now just confirm success
      onAdd(); // Notify parent to re-fetch
      onClose(); // Close modal
    } catch (error) {
      console.error("Error adding inspection:", error);
      alert("Failed to add inspection. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-96 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-center">Add Inspection</h3>
        <div className="space-y-4">

          <div>
            <label className="block mb-2 font-medium">Vehicle</label>
            {loadingVehicles ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 text-sm">
                Loading vehicles...
              </div>
            ) : (
              <select
                onChange={handleVehicleChange}
                defaultValue=""
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
              >
                <option value="" disabled>Select a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.plate_number} — {v.brand} {v.model} {v.year}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block mb-2 font-medium">Vehicle Type</label>
            <input
              type="text"
              value={form.type}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-600 cursor-not-allowed"
              placeholder="Auto-filled from vehicle"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Inspection Type</label>
            <select
              value={form.inspectionType}
              onChange={(e) => setForm({ ...form, inspectionType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
            >
              <option value="" disabled>Select inspection type</option>
              <option value="Regular Check">Regular Check</option>
              <option value="Maintenance Check">Maintenance Check</option>
              <option value="Issue Inspection">Issue Inspection</option>
              <option value="Milestone Check">Milestone Check</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Scheduled Date</label>
            <input
              type="date"
              value={form.scheduledDate}
              onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>

          <div className="flex justify-center mt-6 space-x-4">
            <button
              onClick={onClose}
              className="px-12 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 font-medium"
            >
              Back
            </button>
            <button
              onClick={submit}
              disabled={!form.selectedVehicleId || !form.inspectionType || !form.scheduledDate}
              className="px-12 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
