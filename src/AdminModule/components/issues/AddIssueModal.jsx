import React, { useState, useEffect } from "react";
import { useAuth } from "../../../security/AuthContext";

export default function AddIssueModal({ onClose, onAdd }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ 
    issue: "", 
    type: "", 
    date: "", 
    time: "", 
    plateNumber: "",
    vehicleId: "",
    severity: "medium"
  });
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        vehicleId: selectedId,
        plateNumber: vehicle.plate_number || "",
        type: vehicle.vehicle_type || "Standard",
      }));
    } else {
      setForm((f) => ({ ...f, vehicleId: "", plateNumber: "", type: "" }));
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const reportedDate = form.date && form.time 
        ? new Date(`${form.date}T${form.time}`).toISOString()
        : new Date().toISOString();

      const response = await fetch("/.netlify/functions/logVehicleIssue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicle_id: form.vehicleId,
          plate: form.plateNumber,
          custom_issue: form.issue,
          issue_description: form.issue,
          severity: form.severity,
          timestamp: reportedDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add issue");
      }

      onAdd(data.data);
      onClose();
    } catch (err) {
      console.error("Error adding issue:", err);
      setError(err.message || "Failed to add issue. Please try again.");
    } finally {
      setLoading(false);
    }
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
            <label className="block mb-2 font-medium">Severity</label>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-center mt-6 space-x-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-12 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 font-medium disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={submit}
              disabled={!form.plateNumber || !form.issue || !form.date || loading}
              className="px-12 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Confirm"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
