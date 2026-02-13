import React, { useState, useEffect } from "react";

export default function AddIssueModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ issue: "", type: "", date: "", time: "", plateNumber: "" });
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    fetch("/.netlify/functions/getVehicles")
      .then((r) => r.json())
      .then((data) => setVehicles(data.vehicles || []))
      .catch(() => setVehicles([]))
      .finally(() => setLoadingVehicles(false));
  }, []);

  const handleVehicleChange = (e) => {
    const selectedId = parseInt(e.target.value, 10);
    const vehicle = vehicles.find((v) => v.vehicle_id === selectedId);
    if (vehicle) {
      setForm((f) => ({
        ...f,
        plateNumber: vehicle.plate_number || "",
        type: vehicle.vehicle_type || "Standard",
      }));
    } else {
      setForm((f) => ({ ...f, plateNumber: "", type: "" }));
    }
  };

  const submit = () => {
    onAdd(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-96 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-center">Issue</h3>
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
              placeholder="Auto-filled from vehicle"
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Issue</label>
            <input
              type="text"
              placeholder="e.g. Flat tire"
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
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
              disabled={!form.plateNumber || !form.issue || !form.date}
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
